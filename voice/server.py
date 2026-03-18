"""
OpenClaw Voice Server — Qwen3-TTS 1.7B
Runs as a local FastAPI service inside the OpenClaw project.
Provides voice cloning and TTS for the content pipeline.

Start: python voice/server.py
API:   POST http://localhost:17500/generate
"""

import os
import uuid
import logging
from pathlib import Path
from contextlib import asynccontextmanager

import torch
import soundfile as sf
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional

# ── Config ──
MODEL_ID = "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice"
VOICE_DIR = Path(__file__).parent / "profiles"
OUTPUT_DIR = Path(__file__).parent / "output"
PORT = 17500
SAMPLE_RATE = 24000

logging.basicConfig(level=logging.INFO, format="[Voice] %(message)s")
logger = logging.getLogger("voice")

# ── Global model reference ──
model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup, cleanup on shutdown."""
    global model
    logger.info(f"Loading {MODEL_ID}...")

    from qwen_tts import Qwen3TTSModel
    import torch

    model = Qwen3TTSModel.from_pretrained(
        MODEL_ID,
        device_map="auto",
        dtype=torch.float16,
    )
    logger.info("Model loaded. Voice server ready.")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    VOICE_DIR.mkdir(parents=True, exist_ok=True)

    yield

    # Cleanup
    del model
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    logger.info("Voice server shut down.")


app = FastAPI(title="OpenClaw Voice Server", lifespan=lifespan)


# ── Request/Response Models ──

LANG_MAP = {"en": "english", "zh": "chinese", "ja": "japanese", "ko": "korean",
             "de": "german", "fr": "french", "it": "italian", "pt": "portuguese",
             "ru": "russian", "es": "spanish"}

class GenerateRequest(BaseModel):
    text: str
    profile_id: Optional[str] = None  # voice profile name (matches filename in profiles/)
    language: str = "english"
    speed: float = 1.0
    instruct: Optional[str] = None  # e.g., "speak softly", "excited tone"


class ProfileCreateRequest(BaseModel):
    name: str
    reference_text: str  # what is being said in the reference audio


class VoiceProfile(BaseModel):
    id: str
    name: str
    audio_file: str
    reference_text: str


# ── Routes ──

@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_ID, "gpu": _gpu_info()}


@app.get("/profiles")
async def list_profiles():
    """List all voice profiles."""
    profiles = []
    for f in VOICE_DIR.glob("*.wav"):
        meta_file = f.with_suffix(".txt")
        ref_text = meta_file.read_text().strip() if meta_file.exists() else ""
        profiles.append({
            "id": f.stem,
            "name": f.stem,
            "audio_file": str(f),
            "reference_text": ref_text,
        })
    return {"profiles": profiles}


@app.post("/generate")
async def generate_speech(req: GenerateRequest):
    """Generate speech, optionally cloning a voice profile."""
    global model
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        output_id = str(uuid.uuid4())[:8]
        output_path = OUTPUT_DIR / f"{output_id}.wav"

        # Normalize language code
        lang = LANG_MAP.get(req.language, req.language)

        if req.profile_id:
            # Voice cloning mode
            ref_audio = VOICE_DIR / f"{req.profile_id}.wav"
            ref_meta = VOICE_DIR / f"{req.profile_id}.txt"

            if not ref_audio.exists():
                raise HTTPException(status_code=404, detail=f"Voice profile '{req.profile_id}' not found")

            ref_text = ref_meta.read_text().strip() if ref_meta.exists() else ""

            audio = model.generate_voice_clone(
                text=req.text,
                language=lang,
                ref_audio=str(ref_audio),
                ref_text=ref_text,
            )
        else:
            # Default voice mode (no cloning) — needs a speaker name
            # Supported: aiden, dylan, eric, ono_anna, ryan, serena, sohee, uncle_fu, vivian
            speaker = "serena"  # default female voice
            if req.instruct:
                audio = model.generate_custom_voice(
                    text=req.text,
                    speaker=speaker,
                    language=lang,
                    instruct=req.instruct,
                )
            else:
                audio = model.generate_custom_voice(
                    text=req.text,
                    speaker=speaker,
                    language=lang,
                )

        # Handle output format — returns (List[ndarray], sample_rate)
        if isinstance(audio, tuple):
            audio_list, sr = audio
            # Concatenate all chunks
            audio_data = np.concatenate(audio_list) if isinstance(audio_list, list) else audio_list
        else:
            audio_data = audio
            sr = SAMPLE_RATE

        # Convert to numpy if tensor
        if hasattr(audio_data, "cpu"):
            audio_data = audio_data.cpu().numpy()

        # Ensure 1D
        if audio_data.ndim > 1:
            audio_data = audio_data.squeeze()

        sf.write(str(output_path), audio_data, sr)

        return FileResponse(
            str(output_path),
            media_type="audio/wav",
            filename=f"{output_id}.wav",
            headers={"X-Audio-Duration": str(len(audio_data) / sr)},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/profiles/upload")
async def upload_profile(name: str, reference_text: str, request: "Request"):
    """
    Upload a voice profile. Send the audio as the request body.
    Usage: curl -X POST 'http://localhost:17500/profiles/upload?name=alice&reference_text=Hello+world'
           -H 'Content-Type: audio/wav' --data-binary @reference.wav
    """
    from starlette.requests import Request as StarletteRequest

    audio_bytes = await request.body()
    if not audio_bytes or len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="No audio data received. Send .wav file as request body.")

    audio_path = VOICE_DIR / f"{name}.wav"
    meta_path = VOICE_DIR / f"{name}.txt"

    audio_path.write_bytes(audio_bytes)
    meta_path.write_text(reference_text)

    logger.info(f"Voice profile '{name}' saved ({len(audio_bytes)} bytes)")

    return JSONResponse({
        "ok": True,
        "profile_id": name,
        "audio_file": str(audio_path),
        "size_bytes": len(audio_bytes),
        "reference_text": reference_text,
    })


@app.delete("/profiles/{profile_id}")
async def delete_profile(profile_id: str):
    """Delete a voice profile."""
    audio_file = VOICE_DIR / f"{profile_id}.wav"
    meta_file = VOICE_DIR / f"{profile_id}.txt"
    if audio_file.exists():
        audio_file.unlink()
    if meta_file.exists():
        meta_file.unlink()
    return {"ok": True, "deleted": profile_id}


def _gpu_info():
    try:
        import torch
        if torch.cuda.is_available():
            name = torch.cuda.get_device_name(0)
            mem = torch.cuda.get_device_properties(0).total_memory / 1024**3
            return f"{name} ({mem:.1f}GB)"
        return "CPU only"
    except Exception:
        return "unknown"


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
