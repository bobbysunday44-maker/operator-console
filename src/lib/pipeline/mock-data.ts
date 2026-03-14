import type { PipelineStage, CharacterRef, PublishTarget, ContentMeta } from "./types";

export const CONTENT_META: ContentMeta = {
  id: "CNT-0047",
  title: "AI Agents Automate Your Social Media",
  tags: ["TikTok", "AI", "automation", "trending"],
  targets: ["TikTok", "Instagram", "Twitter"],
  date: "Mar 11, 2026",
  platform: "TikTok",
};

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "prompt",
    label: "Prompt Writer",
    icon: "\u270D\uFE0F",
    agent: "Claude Sonnet",
    status: "complete",
    duration: "2.1s",
    cost: "$0.003",
    input:
      "Create a TikTok post about AI agents automating social media. Trendy, Gen-Z tone, hook in first 2 seconds.",
    output:
      'Image prompt: "A sleek robot hand scrolling through a phone showing Instagram, TikTok, Twitter feeds. Neon glow, dark background, cinematic lighting, 8K detail."\n\nVideo prompt: "Camera slowly zooms into a phone screen where AI agents are posting content autonomously. Glitch effects, fast cuts, trending audio vibe."\n\nCaption: "POV: your AI agent just posted to 6 platforms while you were sleeping \uD83E\uDD16\u2728 #AIautomation #ContentCreator"',
    tokens: { in: 124, out: 287 },
  },
  {
    id: "image",
    label: "Image Generation",
    icon: "\uD83C\uDFA8",
    agent: "Gemini Nano Banana 2",
    status: "complete",
    duration: "4.8s",
    cost: "$0.002",
    input:
      "A sleek robot hand scrolling through a phone showing Instagram, TikTok, Twitter feeds. Neon glow, dark background, cinematic lighting, 8K detail.",
    output: "GENERATED_IMAGE",
    resolution: "1024 \u00D7 1024",
    model: "gemini-3.1-flash-image-preview",
  },
  {
    id: "video",
    label: "Video Generation",
    icon: "\uD83C\uDFAC",
    agent: "Gemini Veo 3.1",
    status: "running",
    duration: "~45s",
    cost: "~$0.05",
    input:
      "Camera slowly zooms into a phone screen where AI agents are posting content autonomously. Glitch effects, fast cuts, trending audio vibe.",
    output: null,
    progress: 67,
    resolution: "1080p \u00B7 8 seconds",
    model: "veo-3.1-generate-preview",
    refImages: 1,
  },
  {
    id: "voiceover",
    label: "Voiceover",
    icon: "\uD83C\uDF99\uFE0F",
    agent: "edge-tts",
    status: "queued",
    duration: "\u2014",
    cost: "Free",
    input:
      "POV: your AI agent just posted to 6 platforms while you were sleeping. Imagine waking up to thousands of new followers...",
    output: null,
    voice: "en-US-GuyNeural",
  },
  {
    id: "assembly",
    label: "Final Assembly",
    icon: "\uD83D\uDD27",
    agent: "FFmpeg",
    status: "queued",
    duration: "\u2014",
    cost: "Free",
    input:
      "Combine: video clip + voiceover + background music (30% volume) \u2192 vertical 9:16 MP4",
    output: null,
  },
];

export const CHARACTER_REFS: CharacterRef[] = [
  { name: "Nova", description: "Robot assistant with blue LED eyes", emoji: "\uD83E\uDD16" },
  { name: "Alex", description: "Young creator, streetwear style", emoji: "\uD83E\uDDD1" },
];

export const PUBLISH_TARGETS: PublishTarget[] = [
  { name: "TikTok", handle: "@openclaw_ai", time: "3:00 PM" },
  { name: "Instagram", handle: "@openclaw.ai", time: "3:15 PM" },
  { name: "Twitter/X", handle: "@openclaw_ai", time: "3:30 PM" },
];

export const PIPELINE_MODELS = [
  { name: "Claude Sonnet 4.6", type: "Language", colorClass: "bg-oc-purple", bgClass: "bg-oc-purple-light" },
  { name: "Nano Banana 2", type: "Image", colorClass: "bg-oc-blue", bgClass: "bg-oc-blue-light" },
  { name: "Veo 3.1", type: "Video", colorClass: "bg-oc-teal", bgClass: "bg-oc-teal-light" },
  { name: "edge-tts", type: "Audio", colorClass: "bg-oc-amber", bgClass: "bg-oc-amber-light" },
];

export const COST_BREAKDOWN = [
  { label: "Prompt Writer", cost: "$0.003" },
  { label: "Image Gen", cost: "$0.002" },
  { label: "Video Gen", cost: "~$0.05" },
  { label: "Voiceover", cost: "Free" },
  { label: "Assembly", cost: "Free" },
];
