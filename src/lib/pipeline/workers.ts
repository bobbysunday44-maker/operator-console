/* ── Content Pipeline Workers ──
 * BullMQ worker that processes each pipeline stage.
 * Each stage calls its respective AI API and updates the DB.
 */

import { Worker, type Job } from "bullmq";
import Anthropic from "@anthropic-ai/sdk";
import { redisConnection } from "@/lib/queue/connection";
import { QUEUE_NAMES, type PipelineJobData } from "@/lib/queue/queues";
import { prisma } from "@/lib/db/prisma";
import { getRequiredSetting, getSetting } from "@/lib/db/settings";
import { logModelUsage } from "@/lib/queue/usage-logger";
import { eventBus } from "@/lib/events/event-bus";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { queueStage, getNextStage } from "./orchestrator";
import { reviewContent } from "./opus-review";
import { getPersonality } from "@/lib/agents/personalities";
import { getPlatformStrategy } from "@/lib/agents/platform-strategies";
import { getLearningsForPrompt } from "@/lib/analytics/feedback-engine";
import { getMemoryForPrompt } from "@/lib/memory/brand-memory";
import { getVoiceForPrompt } from "@/lib/memory/brand-voice";
import { getCharacterForContent, getCharacterPrompt } from "@/lib/characters/character-engine";

const execFileAsync = promisify(execFile);

// Helper to queue next pipeline stage after current one completes
async function queueNextStage(contentItemId: string, currentStage: string) {
  const content = await prisma.contentItem.findUnique({ where: { id: contentItemId }, select: { tags: true } });
  const includeLipSync = content?.tags.includes("__lip_sync__") ?? false;
  const next = getNextStage(currentStage as Parameters<typeof getNextStage>[0], includeLipSync);
  if (next) {
    await queueStage(contentItemId, next);
  }
}

/* ── Helpers ── */

async function getArchivePath(contentItemId: string, stage: string, ext: string): Promise<string> {
  const basePath = (await getSetting("CONTENT_ARCHIVE_PATH")) || "./content-archive";
  const dir = join(basePath, contentItemId);
  await mkdir(dir, { recursive: true });
  return join(dir, `${stage}-${Date.now()}.${ext}`);
}

async function updateRun(runId: string, data: {
  status: "in_progress" | "completed" | "failed";
  outputPath?: string;
  outputPreview?: string;
  tokensIn?: number;
  tokensOut?: number;
  cost?: number;
  duration?: number;
  error?: string;
}) {
  await prisma.pipelineRun.update({
    where: { id: runId },
    data: {
      ...data,
      completedAt: data.status === "completed" || data.status === "failed" ? new Date() : undefined,
    },
  });
}

/* ── Stage: Prompt (Claude) ── */

async function processPrompt(job: Job<PipelineJobData>) {
  const { contentItemId, pipelineRunId } = job.data;
  await updateRun(pipelineRunId, { status: "in_progress" });

  const content = await prisma.contentItem.findUnique({ where: { id: contentItemId } });
  if (!content) throw new Error(`Content ${contentItemId} not found`);

  const apiKey = await getRequiredSetting("ANTHROPIC_API_KEY");
  const client = new Anthropic({ apiKey });
  const startTime = Date.now();

  // Load ALL intelligence for this content
  const writerPersonality = getPersonality("writer");
  const platformGuidance = content.targetPlatforms
    .map((p) => getPlatformStrategy(p))
    .filter(Boolean)
    .join("\n\n---\n\n");

  // Feature 1: Performance learnings (what worked before)
  const performanceInsights = content.niche ? await getLearningsForPrompt(content.niche) : "";

  // Feature 5: Brand memory + voice
  const brandMemory = content.niche ? await getMemoryForPrompt(content.niche) : "";
  const brandVoice = content.niche ? await getVoiceForPrompt(content.niche) : "";

  // Feature 4: Character consistency
  let characterPrompt = "";
  if (content.niche) {
    const character = await getCharacterForContent(content.niche);
    if (character) {
      characterPrompt = await getCharacterPrompt(character.id);
    }
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: `${writerPersonality}

${characterPrompt ? `---\n${characterPrompt}` : ""}

${brandVoice ? `---\n${brandVoice}` : ""}

${brandMemory ? `---\n${brandMemory}` : ""}

${performanceInsights ? `---\n${performanceInsights}` : ""}

---

You are generating a complete production brief for short-form video content.

Return a JSON object with ALL these fields:

**Core Content:**
- imagePrompt: detailed prompt for AI image generation (cinematic, specific composition, lighting, 1024x1024)
- videoPrompt: detailed prompt for AI video generation (camera movement, pacing, 9:16 vertical, 8 seconds)
- voiceoverScript: narration script for text-to-speech (20-45 seconds, punchy, conversational)
- tags: array of relevant tags

**Hook Optimization (CRITICAL — this determines if people watch):**
- hookVariants: array of 3 hook options, each with:
  - visualHook: what the viewer sees in first 2 seconds (must stop the scroll)
  - textHook: first line of caption (curiosity gap, bold claim, or question)
  - openingLine: first sentence of voiceover (must grab attention immediately)
- bestHookIndex: which of the 3 hooks you recommend (0, 1, or 2) and why

**Thumbnail:**
- thumbnailPrompt: prompt for a click-worthy thumbnail image — must include: bold readable text overlay, high contrast colors, expressive face or dramatic visual, 16:9 aspect ratio
- thumbnailText: the exact text to overlay on the thumbnail (2-5 words max, ALL CAPS)

**Platform-Specific Formatting (use the strategies below to guide tone and format):**
${platformGuidance || "No specific platform strategies loaded."}

- platforms: object with keys for each target platform:
  - tiktok: { caption, hashtags, soundSuggestion, trendReference }
  - instagram: { caption, hashtags, format ("reel" or "carousel"), altText }
  - youtube: { title (SEO optimized, <60 chars), description, tags, category }
  - linkedin: { caption (professional tone), hashtags }
  - twitter: { tweet (<280 chars), threadHook }

Only include platform keys that are in the target platforms list.`,
    messages: [{
      role: "user",
      content: `Create content for: "${content.title}"${content.description ? `\nDescription: ${content.description}` : ""}${content.tags.length ? `\nTags: ${content.tags.join(", ")}` : ""}${content.targetPlatforms.length ? `\nTarget platforms: ${content.targetPlatforms.join(", ")}` : ""}`,
    }],
  });

  const latency = Date.now() - startTime;
  const textBlock = response.content.find((b) => b.type === "text");
  const output = textBlock?.text ?? "";
  const tokensIn = response.usage.input_tokens;
  const tokensOut = response.usage.output_tokens;
  const cost = (tokensIn * 3 + tokensOut * 15) / 1_000_000;

  // Save output
  const outputPath = await getArchivePath(contentItemId, "prompt", "json");
  await writeFile(outputPath, output, "utf-8");

  await updateRun(pipelineRunId, {
    status: "completed",
    outputPath,
    outputPreview: output.slice(0, 500),
    tokensIn,
    tokensOut,
    cost,
    duration: latency,
  });

  // Update content script
  await prisma.contentItem.update({
    where: { id: contentItemId },
    data: { script: output, status: "imaging" },
  });

  await logModelUsage({ model: "claude", taskType: "pipeline_prompt", tokensIn, tokensOut, cost, latency, success: true });
  eventBus.emit({ type: "pipeline_stage", agentName: "Claude", message: `Script complete for "${content.title}" — ${tokensOut} tokens` });

  // Queue next stage
  await queueNextStage(contentItemId, "prompt");
  return { output, outputPath };
}

/* ── Stage: Image (Gemini Nano Banana 2) ── */

async function processImage(job: Job<PipelineJobData>) {
  const { contentItemId, pipelineRunId } = job.data;
  await updateRun(pipelineRunId, { status: "in_progress" });

  // Get the prompt from previous stage — always read full file
  const promptRun = await prisma.pipelineRun.findFirst({
    where: { contentItemId, stage: "prompt", status: "completed" },
    orderBy: { createdAt: "desc" },
  });

  if (!promptRun) throw new Error("No prompt output found");

  let imagePrompt = "A cinematic scene";
  try {
    if (promptRun.outputPath) {
      const { readFile } = await import("fs/promises");
      const rawJson = await readFile(promptRun.outputPath, "utf-8");
      const parsed = JSON.parse(rawJson);
      imagePrompt = parsed.imagePrompt || imagePrompt;
    }
  } catch {
    imagePrompt = promptRun.outputPreview?.slice(0, 200) || imagePrompt;
  }

  const apiKey = await getRequiredSetting("GEMINI_API_KEY");
  const startTime = Date.now();

  // Gemini 3.1 Flash Image Preview — confirmed endpoint from docs
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: imagePrompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
        },
      }),
    }
  );

  const latency = Date.now() - startTime;

  if (!response.ok) {
    const err = await response.text();
    await updateRun(pipelineRunId, { status: "failed", error: err, duration: latency });
    await logModelUsage({ model: "gemini_nano_banana", taskType: "pipeline_image", tokensIn: 0, tokensOut: 0, cost: 0, latency, success: false, error: err });
    throw new Error(`Gemini image API error: ${err}`);
  }

  const result = await response.json();
  const cost = 0.002;

  // Extract inline image data from response
  const parts = result.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p: { inline_data?: { data: string; mime_type: string } }) => p.inline_data);

  if (imagePart?.inline_data) {
    const ext = imagePart.inline_data.mime_type === "image/jpeg" ? "jpg" : "png";
    const outputPath = await getArchivePath(contentItemId, "image", ext);
    const buffer = Buffer.from(imagePart.inline_data.data, "base64");
    await writeFile(outputPath, buffer);

    await updateRun(pipelineRunId, {
      status: "completed",
      outputPath,
      outputPreview: `Image generated (${buffer.length} bytes)`,
      cost,
      duration: latency,
    });

    await prisma.contentAsset.create({
      data: {
        contentItemId,
        type: "image",
        filePath: outputPath,
        fileName: `image-${Date.now()}.${ext}`,
        mimeType: imagePart.inline_data.mime_type,
        fileSize: buffer.length,
        metadata: { prompt: imagePrompt },
      },
    });
  } else {
    // API returned text but no image — fail so it can be retried
    const textParts = parts.filter((p: { text?: string }) => p.text).map((p: { text: string }) => p.text).join("\n");
    await updateRun(pipelineRunId, {
      status: "failed",
      error: `No image returned. API response: ${textParts.slice(0, 300)}`,
      cost,
      duration: latency,
    });
    throw new Error("Gemini returned no image data");
  }

  await prisma.contentItem.update({ where: { id: contentItemId }, data: { status: "filming" } });
  await logModelUsage({ model: "gemini_nano_banana", taskType: "pipeline_image", tokensIn: 0, tokensOut: 0, cost, latency, success: true });
  eventBus.emit({ type: "pipeline_stage", agentName: "Nano Banana 2", message: `Image generated for content ${contentItemId}` });

  await queueNextStage(contentItemId, "image");
}

/* ── Stage: Video (Gemini Veo 3.1) ── */

async function pollOperation(operationName: string, apiKey: string, maxWaitMs = 300_000): Promise<Record<string, unknown>> {
  const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`;
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(pollUrl);
    if (!res.ok) throw new Error(`Poll failed: ${res.status} ${await res.text()}`);

    const data = await res.json();
    if (data.done) return data;

    // Wait 10 seconds between polls
    await new Promise((r) => setTimeout(r, 10_000));
  }

  throw new Error(`Veo operation timed out after ${maxWaitMs / 1000}s`);
}

async function processVideo(job: Job<PipelineJobData>) {
  const { contentItemId, pipelineRunId } = job.data;
  await updateRun(pipelineRunId, { status: "in_progress" });

  const promptRun = await prisma.pipelineRun.findFirst({
    where: { contentItemId, stage: "prompt", status: "completed" },
    orderBy: { createdAt: "desc" },
  });

  let videoPrompt = "A dynamic short video";
  try {
    if (promptRun?.outputPath) {
      const { readFile } = await import("fs/promises");
      const raw = await readFile(promptRun.outputPath, "utf-8");
      const parsed = JSON.parse(raw);
      videoPrompt = parsed.videoPrompt || videoPrompt;
    }
  } catch { /* use default */ }

  const apiKey = await getRequiredSetting("GEMINI_API_KEY");
  const startTime = Date.now();

  // Step 1: Submit Veo 3.1 generation (long-running operation)
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: videoPrompt }],
        parameters: { aspectRatio: "9:16", resolution: "1080p", durationSeconds: "8" },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    const latency = Date.now() - startTime;
    await updateRun(pipelineRunId, { status: "failed", error: err, duration: latency });
    await logModelUsage({ model: "gemini_veo", taskType: "pipeline_video", tokensIn: 0, tokensOut: 0, cost: 0, latency, success: false, error: err });
    throw new Error(`Veo API error: ${err}`);
  }

  const submitResult = await response.json();
  const operationName = submitResult.name;

  if (!operationName) {
    throw new Error("Veo API did not return an operation name");
  }

  eventBus.emit({ type: "pipeline_stage", agentName: "Veo 3.1", message: `Video generation submitted, polling for completion...` });

  // Step 2: Poll until done (up to 5 minutes)
  const completed = await pollOperation(operationName, apiKey);
  const latency = Date.now() - startTime;

  // Step 3: Download the video file
  // Path: response.generateVideoResponse.generatedSamples[0].video.uri
  const videoUri = (completed as { response?: { generateVideoResponse?: { generatedSamples?: { video?: { uri?: string } }[] } } })
    ?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;

  if (!videoUri) {
    await updateRun(pipelineRunId, { status: "failed", error: "Veo completed but no video URI returned", duration: latency });
    throw new Error("No video URI in Veo response");
  }

  // Download the video
  const videoRes = await fetch(videoUri, { headers: { "x-goog-api-key": apiKey } });
  if (!videoRes.ok) {
    throw new Error(`Failed to download video: ${videoRes.status}`);
  }

  const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
  const outputPath = await getArchivePath(contentItemId, "video", "mp4");
  await writeFile(outputPath, videoBuffer);

  const cost = 0.10 * 8; // ~$0.10/sec × 8 seconds

  await updateRun(pipelineRunId, {
    status: "completed",
    outputPath,
    outputPreview: `Video generated (${(videoBuffer.length / 1024 / 1024).toFixed(1)} MB)`,
    cost,
    duration: latency,
  });

  // Save as content asset
  await prisma.contentAsset.create({
    data: {
      contentItemId,
      type: "video",
      filePath: outputPath,
      fileName: `video-${Date.now()}.mp4`,
      mimeType: "video/mp4",
      fileSize: videoBuffer.length,
      metadata: { prompt: videoPrompt, operationName },
    },
  });

  await prisma.contentItem.update({ where: { id: contentItemId }, data: { status: "voiceover" } });
  await logModelUsage({ model: "gemini_veo", taskType: "pipeline_video", tokensIn: 0, tokensOut: 0, cost, latency, success: true });
  eventBus.emit({ type: "pipeline_stage", agentName: "Veo 3.1", message: `Video downloaded for content ${contentItemId} (${(videoBuffer.length / 1024 / 1024).toFixed(1)} MB)` });

  await queueNextStage(contentItemId, "video");
}

/* ── Stage: Voiceover (Qwen3-TTS 1.7B local → edge-tts fallback) ── */

const VOICE_SERVER_URL = "http://localhost:17500";

async function processVoiceover(job: Job<PipelineJobData>) {
  const { contentItemId, pipelineRunId } = job.data;
  await updateRun(pipelineRunId, { status: "in_progress" });

  const promptRun = await prisma.pipelineRun.findFirst({
    where: { contentItemId, stage: "prompt", status: "completed" },
    orderBy: { createdAt: "desc" },
  });

  let voiceoverScript = "Welcome to our content.";
  try {
    if (promptRun?.outputPath) {
      const { readFile } = await import("fs/promises");
      const raw = await readFile(promptRun.outputPath, "utf-8");
      const parsed = JSON.parse(raw);
      voiceoverScript = parsed.voiceoverScript || voiceoverScript;
    }
  } catch { /* use default */ }

  // Determine voice profile — check if character has a voice profile
  const content = await prisma.contentItem.findUnique({ where: { id: contentItemId }, select: { niche: true } });
  let voiceProfileId: string | null = null;

  if (content?.niche) {
    const character = await getCharacterForContent(content.niche);
    if (character?.profile?.voiceModelId) {
      voiceProfileId = character.profile.voiceModelId;
    }
  }

  let outputPath = await getArchivePath(contentItemId, "voiceover", "wav");
  const startTime = Date.now();

  try {
    // Try Qwen3-TTS local voice server first
    let usedEngine = "qwen3-tts";
    let success = false;

    try {
      const healthCheck = await fetch(`${VOICE_SERVER_URL}/health`, { signal: AbortSignal.timeout(3000) });
      if (healthCheck.ok) {
        // Voice server is running — use it
        const body: Record<string, unknown> = {
          text: voiceoverScript,
          language: "en",
        };
        if (voiceProfileId) body.profile_id = voiceProfileId;

        const voiceRes = await fetch(`${VOICE_SERVER_URL}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(120000),
        });

        if (voiceRes.ok) {
          const audioBuffer = await voiceRes.arrayBuffer();
          await writeFile(outputPath, Buffer.from(audioBuffer));
          success = true;
        }
      }
    } catch {
      // Voice server not available — fall through to edge-tts
    }

    // Fallback to edge-tts if voice server is down
    if (!success) {
      usedEngine = "edge-tts";
      const voice = (await getSetting("DEFAULT_TTS_VOICE")) || "en-US-GuyNeural";
      const mp3Path = outputPath.replace(".wav", ".mp3");

      // Use edge-tts from project venv — not system Python
      const venvEdgeTts = join(process.cwd(), "voice", ".venv", "Scripts", "edge-tts.exe");
      const edgeTtsCmd = (await import("fs")).existsSync(venvEdgeTts) ? venvEdgeTts : "edge-tts";

      await execFileAsync(edgeTtsCmd, [
        "--voice", voice,
        "--text", voiceoverScript,
        "--write-media", mp3Path,
      ], { timeout: 60000 });

      // edge-tts outputs MP3 — update outputPath to match actual format
      outputPath = mp3Path;
    }

    const latency = Date.now() - startTime;

    await updateRun(pipelineRunId, {
      status: "completed",
      outputPath,
      outputPreview: `Voiceover: ${usedEngine}${voiceProfileId ? ` (profile: ${voiceProfileId})` : ""} (${voiceoverScript.length} chars)`,
      cost: 0,
      duration: latency,
    });

    await prisma.contentAsset.create({
      data: {
        contentItemId,
        type: "audio",
        filePath: outputPath,
        fileName: `voiceover-${Date.now()}.${usedEngine === "qwen3-tts" ? "wav" : "mp3"}`,
        mimeType: usedEngine === "qwen3-tts" ? "audio/wav" : "audio/mpeg",
        metadata: { engine: usedEngine, profileId: voiceProfileId, textLength: voiceoverScript.length },
      },
    });

    await prisma.contentItem.update({ where: { id: contentItemId }, data: { status: "assembly" } });
    await logModelUsage({ model: usedEngine === "qwen3-tts" ? "qwen3_tts" : "edge_tts", taskType: "pipeline_voiceover", tokensIn: 0, tokensOut: 0, cost: 0, latency, success: true });
    eventBus.emit({ type: "pipeline_stage", agentName: usedEngine, message: `Voiceover generated for content ${contentItemId}${voiceProfileId ? ` using voice profile ${voiceProfileId}` : ""}` });

    await queueNextStage(contentItemId, "voiceover");
  } catch (err) {
    const latency = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : "Voiceover failed";
    await updateRun(pipelineRunId, { status: "failed", error: errorMsg, duration: latency });
    await logModelUsage({ model: "qwen3_tts", taskType: "pipeline_voiceover", tokensIn: 0, tokensOut: 0, cost: 0, latency, success: false, error: errorMsg });
    throw err;
  }
}

/* ── Stage: Lip Sync (Kling via fal.ai) ── */

async function processLipSync(job: Job<PipelineJobData>) {
  const { contentItemId, pipelineRunId } = job.data;
  await updateRun(pipelineRunId, { status: "in_progress" });

  // KLING_API_KEY is used as FAL_KEY for fal.ai hosted Kling
  const falKey = await getRequiredSetting("KLING_API_KEY");
  const startTime = Date.now();

  // Get video and audio from previous stages
  const [videoAsset, audioAsset] = await Promise.all([
    prisma.contentAsset.findFirst({ where: { contentItemId, type: "video" }, orderBy: { createdAt: "desc" } }),
    prisma.contentAsset.findFirst({ where: { contentItemId, type: "audio" }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!videoAsset || !audioAsset) {
    await updateRun(pipelineRunId, { status: "failed", error: "Missing video or audio asset for lip sync" });
    return;
  }

  // Step 1: Submit lip sync job to fal.ai queue
  const submitRes = await fetch("https://queue.fal.run/fal-ai/kling-video/lipsync/audio-to-video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Key ${falKey}`,
    },
    body: JSON.stringify({
      video_url: videoAsset.filePath,
      audio_url: audioAsset.filePath,
    }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    const latency = Date.now() - startTime;
    await updateRun(pipelineRunId, { status: "failed", error: err, duration: latency });
    await logModelUsage({ model: "kling", taskType: "pipeline_lip_sync", tokensIn: 0, tokensOut: 0, cost: 0, latency, success: false, error: err });
    throw new Error(`Kling/fal.ai submit error: ${err}`);
  }

  const submitData = await submitRes.json();
  const requestId = submitData.request_id;

  if (!requestId) throw new Error("fal.ai did not return request_id");

  eventBus.emit({ type: "pipeline_stage", agentName: "Kling", message: `Lip sync submitted, polling...` });

  // Step 2: Poll for completion (up to 5 minutes)
  const pollUrl = `https://queue.fal.run/fal-ai/kling-video/lipsync/audio-to-video/requests/${requestId}/status`;
  const maxWait = 300_000;
  const pollStart = Date.now();

  while (Date.now() - pollStart < maxWait) {
    const statusRes = await fetch(pollUrl, {
      headers: { "Authorization": `Key ${falKey}` },
    });
    const statusData = await statusRes.json();

    if (statusData.status === "COMPLETED") break;
    if (statusData.status === "FAILED") {
      throw new Error(`Kling lip sync failed: ${JSON.stringify(statusData)}`);
    }

    await new Promise((r) => setTimeout(r, 10_000));
  }

  // Step 3: Get result
  const resultRes = await fetch(
    `https://queue.fal.run/fal-ai/kling-video/lipsync/audio-to-video/requests/${requestId}`,
    { headers: { "Authorization": `Key ${falKey}` } }
  );

  if (!resultRes.ok) throw new Error(`Failed to get lip sync result: ${resultRes.status}`);

  const resultData = await resultRes.json();
  const videoUrl = resultData.video?.url;

  if (!videoUrl) throw new Error("Kling returned no video URL");

  // Download the synced video
  const videoRes = await fetch(videoUrl);
  const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
  const outputPath = await getArchivePath(contentItemId, "lipsync", "mp4");
  await writeFile(outputPath, videoBuffer);

  const latency = Date.now() - startTime;
  const cost = 0.014 * 8; // $0.014 per second, ~8 seconds

  await updateRun(pipelineRunId, {
    status: "completed",
    outputPath,
    outputPreview: `Lip-synced video (${(videoBuffer.length / 1024 / 1024).toFixed(1)} MB)`,
    cost,
    duration: latency,
  });

  // Replace the video asset with the lip-synced version
  await prisma.contentAsset.create({
    data: {
      contentItemId,
      type: "video",
      filePath: outputPath,
      fileName: `lipsync-${Date.now()}.mp4`,
      mimeType: "video/mp4",
      fileSize: videoBuffer.length,
      metadata: { requestId, source: "kling-lipsync" },
    },
  });

  await logModelUsage({ model: "kling", taskType: "pipeline_lip_sync", tokensIn: 0, tokensOut: 0, cost, latency, success: true });
  eventBus.emit({ type: "pipeline_stage", agentName: "Kling", message: `Lip sync complete for content ${contentItemId}` });

  await queueNextStage(contentItemId, "lip_sync");
}

/* ── Stage: Assembly (FFmpeg) ── */

async function processAssembly(job: Job<PipelineJobData>) {
  const { contentItemId, pipelineRunId } = job.data;
  await updateRun(pipelineRunId, { status: "in_progress" });

  // Get all assets
  const assets = await prisma.contentAsset.findMany({
    where: { contentItemId },
    orderBy: { createdAt: "desc" },
  });

  const videoAsset = assets.find((a) => a.type === "video");
  const audioAsset = assets.find((a) => a.type === "audio");

  const outputPath = await getArchivePath(contentItemId, "final", "mp4");
  const startTime = Date.now();

  try {
    if (videoAsset && audioAsset) {
      // Combine video + audio with FFmpeg — execFile avoids shell injection
      await execFileAsync("ffmpeg", [
        "-y", "-i", videoAsset.filePath, "-i", audioAsset.filePath,
        "-c:v", "copy", "-c:a", "aac", "-shortest", outputPath,
      ], { timeout: 120000 });
    } else if (audioAsset) {
      // Audio only — create slideshow from images
      const imageAsset = assets.find((a) => a.type === "image");
      if (imageAsset) {
        await execFileAsync("ffmpeg", [
          "-y", "-loop", "1", "-i", imageAsset.filePath, "-i", audioAsset.filePath,
          "-c:v", "libx264", "-tune", "stillimage", "-c:a", "aac", "-shortest",
          "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
          outputPath,
        ], { timeout: 120000 });
      }
    }

    const latency = Date.now() - startTime;

    await updateRun(pipelineRunId, {
      status: "completed",
      outputPath,
      outputPreview: `Final video assembled: ${outputPath}`,
      cost: 0,
      duration: latency,
    });

    // Update content item
    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: { finalOutput: outputPath, status: "review" },
    });

    // Save final asset
    await prisma.contentAsset.create({
      data: {
        contentItemId,
        type: "video",
        filePath: outputPath,
        fileName: `final-${Date.now()}.mp4`,
        mimeType: "video/mp4",
      },
    });

    await logModelUsage({ model: "ffmpeg", taskType: "pipeline_assembly", tokensIn: 0, tokensOut: 0, cost: 0, latency, success: true });
    eventBus.emit({ type: "content_created", agentName: "FFmpeg", message: `Final video assembled for content ${contentItemId}` });

    // Opus reviews the assembled content before Bobby sees it
    console.log(`[Pipeline] Assembly complete — Opus reviewing content ${contentItemId}`);
    try {
      const review = await reviewContent(contentItemId);
      console.log(`[Pipeline] Opus review: ${review.score}/10 — ${review.approved ? "approved for Bobby" : "sent back"}`);
    } catch (reviewErr) {
      console.error("[Pipeline] Opus review failed:", reviewErr);
      // Don't fail the pipeline if review fails — content stays at "review" status
    }
  } catch (err) {
    const latency = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : "FFmpeg failed";
    await updateRun(pipelineRunId, { status: "failed", error: errorMsg, duration: latency });
    await logModelUsage({ model: "ffmpeg", taskType: "pipeline_assembly", tokensIn: 0, tokensOut: 0, cost: 0, latency, success: false, error: errorMsg });
    throw err;
  }
}

/* ── Stage Router ── */

const STAGE_PROCESSORS: Record<string, (job: Job<PipelineJobData>) => Promise<unknown>> = {
  prompt: processPrompt,
  image: processImage,
  video: processVideo,
  voiceover: processVoiceover,
  lip_sync: processLipSync,
  assembly: processAssembly,
};

/* ── Worker ── */

export function createPipelineWorker() {
  return new Worker<PipelineJobData>(
    QUEUE_NAMES.CONTENT_PIPELINE,
    async (job) => {
      const { stage } = job.data;
      const processor = STAGE_PROCESSORS[stage];

      if (!processor) {
        throw new Error(`Unknown pipeline stage: ${stage}`);
      }

      console.log(`[Pipeline] Processing stage: ${stage} for content ${job.data.contentItemId}`);
      return processor(job);
    },
    {
      connection: redisConnection,
      concurrency: 5, // Handle up to 5 pipelines simultaneously
    }
  );
}
