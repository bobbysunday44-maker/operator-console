/* ── Voice Server Launcher ──
 * Spawns the Python Qwen3-TTS voice server as a child process.
 * Called by startup.ts when Next.js boots.
 * Voice server lives and dies with OpenClaw — no separate command needed.
 */

import { spawn, type ChildProcess } from "child_process";
import { join } from "path";

let voiceProcess: ChildProcess | null = null;
const VOICE_PORT = 17500;
const VOICE_DIR = join(process.cwd(), "voice");

export function startVoiceServer() {
  if (voiceProcess) {
    console.log("[Voice] Already running");
    return;
  }

  // Use dedicated venv — isolated from other projects
  const pythonPath = process.platform === "win32"
    ? join(VOICE_DIR, ".venv", "Scripts", "python.exe")
    : join(VOICE_DIR, ".venv", "bin", "python3");

  const serverScript = join(VOICE_DIR, "server.py");

  console.log("[Voice] Starting Qwen3-TTS voice server...");

  voiceProcess = spawn(pythonPath, [serverScript], {
    cwd: VOICE_DIR,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });

  voiceProcess.stdout?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) console.log(`[Voice] ${msg}`);
  });

  voiceProcess.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg && !msg.includes("INFO:")) console.error(`[Voice] ${msg}`);
  });

  voiceProcess.on("error", (err) => {
    console.error(`[Voice] Failed to start: ${err.message}`);
    console.error("[Voice] Make sure Python 3.10+ is installed and voice/requirements.txt dependencies are installed");
    voiceProcess = null;
  });

  voiceProcess.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`[Voice] Exited with code ${code}`);
    }
    voiceProcess = null;
  });

  // Cleanup on process exit
  process.on("exit", stopVoiceServer);
  process.on("SIGINT", stopVoiceServer);
  process.on("SIGTERM", stopVoiceServer);
}

export function stopVoiceServer() {
  if (voiceProcess) {
    console.log("[Voice] Shutting down voice server...");
    voiceProcess.kill("SIGTERM");
    voiceProcess = null;
  }
}

export function isVoiceServerRunning(): boolean {
  return voiceProcess !== null && !voiceProcess.killed;
}

export function getVoiceServerUrl(): string {
  return `http://localhost:${VOICE_PORT}`;
}
