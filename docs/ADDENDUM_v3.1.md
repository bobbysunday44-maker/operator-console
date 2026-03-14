# OpenClaw Master Plan — Addendum v3.1
# Date: March 11, 2026
# Place this file alongside the other docs. Claude Code should read this AFTER the master plan.
# This file OVERRIDES any conflicting information in the master plan v3.

---

## Changes from Master Plan v3

### 1. REMOVE Qwen 2.5
Qwen is removed from the stack entirely. Do not set up Ollama or any local language model.
All tasks previously assigned to Qwen are now handled by Claude Sonnet 4.6:
- Mention scanning and triage → Claude Sonnet
- Sentiment analysis → Claude Sonnet
- Trending topic research → Claude Sonnet
- Scheduling and routing logic → Claude Sonnet

This means Claude Sonnet is the ONLY language model in the platform.
One model, one API key, simpler routing, simpler architecture.

### 2. ADD Kling AI (Lip Sync API)
Kling AI is added as a specialist model for lip syncing.
It is ONLY used when content involves a character speaking.

Kling Lip Sync capabilities:
- Takes a video file + audio file → outputs video with synced mouth movements
- Supports uploaded custom audio (MP3, WAV, max 20MB, max 60 seconds)
- Supports text-to-speech with built-in voices (backup option)
- Works with AI-generated video from Veo 3.1
- API available (not just browser UI)
- Max 10 seconds per lip sync clip
- Plans from $6.99/month (credit-based)

API reference: https://app.klingai.com (see API section in sidebar)
Third-party API access also available via: https://fal.ai/models/fal-ai/kling-video/lipsync

### 3. UPDATED Final Model Stack (6 models)

| #  | Model                 | Type          | Purpose                                      | Cost           |
|----|----------------------|---------------|----------------------------------------------|----------------|
| 1  | Claude Sonnet 4.6    | Language (API) | ALL language tasks: scripts, posts, replies, scanning, sentiment, triage, commands, quality review | ~$0.02/task |
| 2  | Gemini Nano Banana 2 | Image (API)   | All image generation. Characters, scenes, thumbnails | ~$0.002/image |
| 3  | Gemini Veo 3.1       | Video (API)   | All video generation. First/last frame. Character refs. Audio. 9:16 vertical | $0.10–$0.40/sec |
| 4  | Kling Lip Sync       | Lip Sync (API)| Syncs mouth movements to audio. Only used when characters speak | Credit-based |
| 5  | edge-tts             | TTS (local)   | Voiceover generation. Microsoft voices. Free | Free |
| 6  | FFmpeg               | Tool (local)  | Video assembly. Combines clips + voice + music | Free |

### 4. UPDATED Content Pipeline (with Kling step)

For content WITHOUT speaking characters:
```
Claude writes script/prompts
  → Gemini Nano Banana generates images
    → Gemini Veo 3.1 generates video
      → edge-tts generates voiceover
        → FFmpeg assembles final output
```

For content WITH speaking characters:
```
Claude writes script/prompts
  → Gemini Nano Banana generates images
    → Gemini Veo 3.1 generates video
      → edge-tts generates voiceover
        → Kling Lip Sync takes video + audio → synced video
          → FFmpeg assembles final output
```

The pipeline should detect whether lip sync is needed based on:
- Content item has a "dialogue" or "speaking" tag
- The script contains character dialogue lines
- User explicitly requests lip sync when creating the content

### 5. UPDATED Model Routing

Since there is only one language model (Claude Sonnet), the model routing
module is simplified. It still tracks usage, cost, and latency per task type,
but there are no routing decisions for language tasks.

Routing decisions only apply to the media pipeline:
- Image generation → always Gemini Nano Banana 2
- Video generation → always Gemini Veo 3.1
- Lip sync → Kling (only when needed)
- Voiceover → always edge-tts
- Assembly → always FFmpeg

### 6. UPDATED Database Changes

Remove from model_routes table:
- Any rows referencing Qwen 2.5
- Any rows referencing Ollama

Add to model_routes table:
- task_type: "lip_sync", model_name: "kling", priority: 1, enabled: true

### 7. UPDATED Docker Compose

Ollama container is NO LONGER NEEDED. Remove it from docker-compose.yml.
Final Docker services:
- app (Next.js)
- db (PostgreSQL)
- redis (Redis)

That's it. Three containers.

### 8. UPDATED Cost Projections (daily, moderate usage)

| Item                              | Daily Usage     | Unit Cost        | Daily Cost | Monthly Cost |
|-----------------------------------|----------------|------------------|------------|-------------|
| Claude Sonnet (ALL language tasks) | ~800 calls      | ~$0.02/call      | ~$16       | ~$480       |
| Gemini Nano Banana (images)       | ~60 images      | ~$0.002/image    | ~$0.12     | ~$3.60      |
| Gemini Veo 3.1 (video)            | ~20 clips × 8s  | ~$0.10–$0.40/sec | ~$16–$64   | ~$480–$1,920|
| Kling Lip Sync                    | ~10 clips       | Credit-based     | ~$2–$5     | ~$60–$150   |
| edge-tts (voiceover)              | ~20 clips       | Free             | Free       | Free        |
| FFmpeg (assembly)                 | ~20 assemblies  | Free             | Free       | Free        |
| **TOTAL**                         |                 |                  | ~$34–$85   | ~$1,020–$2,550 |

Note: Claude Sonnet cost is higher than before because it now handles all tasks
that were previously assigned to Qwen. However, the architecture is much simpler
with only one language model to manage.

To reduce Claude costs: use caching for repeated scanning tasks, batch mention
checks instead of individual calls, and use shorter system prompts.

---

## Summary of What Changed

| Before (v3)           | After (v3.1)                    |
|-----------------------|---------------------------------|
| 7 models              | 6 models                        |
| Claude + Qwen         | Claude only                     |
| Ollama container      | No Ollama, no local LLM        |
| No lip sync           | Kling Lip Sync added            |
| 4 Docker containers   | 3 Docker containers             |
| Model routing needed  | Simplified (one language model) |

Everything else in the master plan v3 remains unchanged.
