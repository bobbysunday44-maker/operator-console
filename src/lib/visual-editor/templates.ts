/* ── Visual Editor Workflow Templates ──
 * Pre-built workflow templates adapted from ComfyUI official templates.
 * Each template is a ReactFlow-ready {nodes, edges} structure.
 * 32 total templates: 7 original + 25 from workflow-templates-catalog.md
 */

import type { Node, Edge } from "reactflow";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | "talking_head"
    | "scene_video"
    | "image_gen"
    | "full_pipeline"
    | "dual_character"
    | "dance"
    | "product_demo"
    | "testimonial"
    | "ugc_ad"
    | "product_photo"
    | "ecommerce"
    | "before_after"
    | "unboxing"
    | "day_in_life"
    | "tutorial"
    | "brand_animation"
    | "full_campaign";
  nodes: Node[];
  edges: Edge[];
}

/* ═══════════════════════════════════════════════════
 * ORIGINAL 7 TEMPLATES
 * ═══════════════════════════════════════════════════ */

/* ── Template: Talking Head (Kling Avatar) ── */
const talkingHead: WorkflowTemplate = {
  id: "tmpl-talking-head",
  name: "Talking Head",
  description: "Character image + voice → Kling 3.0 lip-synced talking video. Based on ComfyUI Kling Avatar workflow.",
  category: "talking_head",
  nodes: [
    { id: "char-1", type: "character", position: { x: 0, y: 0 }, data: { name: "Select Character", niche: "", traits: [] } },
    { id: "content-1", type: "content", position: { x: 0, y: 200 }, data: { title: "Enter topic", niche: "", platforms: ["TikTok", "Instagram"] } },
    { id: "prompt-1", type: "prompt", position: { x: 280, y: 100 }, data: { prompt: "", status: "idle" } },
    { id: "image-1", type: "imageGen", position: { x: 560, y: 0 }, data: { model: "Nano Banana 2", status: "idle" } },
    { id: "voice-1", type: "voice", position: { x: 560, y: 200 }, data: { engine: "Qwen3-TTS 1.7B", speaker: "serena", status: "idle" } },
    { id: "lipsync-1", type: "lipSync", position: { x: 840, y: 100 }, data: { model: "Kling 3.0", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1120, y: 100 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "char-1", target: "prompt-1", animated: true, style: { stroke: "#F43F5E" } },
    { id: "e2", source: "content-1", target: "prompt-1", animated: true, style: { stroke: "#6366F1" } },
    { id: "e3", source: "prompt-1", target: "image-1", style: { stroke: "#3B82F6" } },
    { id: "e4", source: "prompt-1", target: "voice-1", style: { stroke: "#F59E0B" } },
    { id: "e5", source: "image-1", target: "lipsync-1", style: { stroke: "#EC4899" } },
    { id: "e6", source: "voice-1", target: "lipsync-1", style: { stroke: "#EC4899" } },
    { id: "e7", source: "lipsync-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template: Scene/B-Roll Video ── */
const sceneVideo: WorkflowTemplate = {
  id: "tmpl-scene-video",
  name: "Scene / B-Roll Video",
  description: "Script → image → Veo 3.1 cinematic video + voiceover → assembled MP4. For product shots, lifestyle content, montages.",
  category: "scene_video",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 120 }, data: { title: "Enter topic", niche: "", platforms: ["YouTube", "TikTok"] } },
    { id: "prompt-1", type: "prompt", position: { x: 280, y: 120 }, data: { prompt: "", status: "idle" } },
    { id: "image-1", type: "imageGen", position: { x: 560, y: 0 }, data: { model: "Nano Banana 2", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 560, y: 180 }, data: { model: "Veo 3.1", duration: "8s", resolution: "1080p", aspect: "9:16", status: "idle" } },
    { id: "voice-1", type: "voice", position: { x: 560, y: 370 }, data: { engine: "Qwen3-TTS 1.7B", speaker: "serena", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 840, y: 200 }, data: { status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1120, y: 200 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "prompt-1", animated: true, style: { stroke: "#6366F1" } },
    { id: "e2", source: "prompt-1", target: "image-1", style: { stroke: "#3B82F6" } },
    { id: "e3", source: "prompt-1", target: "video-1", style: { stroke: "#10B981" } },
    { id: "e4", source: "prompt-1", target: "voice-1", style: { stroke: "#F59E0B" } },
    { id: "e5", source: "video-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e6", source: "voice-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e7", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template: Dual Character (Kling Dual Characters) ── */
const dualCharacter: WorkflowTemplate = {
  id: "tmpl-dual-character",
  name: "Dual Character Interaction",
  description: "Two AI characters interacting — hug, handshake, conversation. Based on ComfyUI Kling Dual Characters workflow.",
  category: "dual_character",
  nodes: [
    { id: "char-1", type: "character", position: { x: 0, y: 0 }, data: { name: "Character A", niche: "", traits: [] } },
    { id: "char-2", type: "character", position: { x: 0, y: 220 }, data: { name: "Character B", niche: "", traits: [] } },
    { id: "image-1", type: "imageGen", position: { x: 280, y: 0 }, data: { model: "Nano Banana 2", label: "Character A Image", status: "idle" } },
    { id: "image-2", type: "imageGen", position: { x: 280, y: 220 }, data: { model: "Nano Banana 2", label: "Character B Image", status: "idle" } },
    { id: "lipsync-1", type: "lipSync", position: { x: 560, y: 110 }, data: { model: "Kling 3.0 Dual", status: "idle" } },
    { id: "voice-1", type: "voice", position: { x: 280, y: 420 }, data: { engine: "Qwen3-TTS 1.7B", speaker: "serena", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 840, y: 150 }, data: { status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1120, y: 150 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "char-1", target: "image-1", style: { stroke: "#F43F5E" } },
    { id: "e2", source: "char-2", target: "image-2", style: { stroke: "#8B5CF6" } },
    { id: "e3", source: "image-1", target: "lipsync-1", style: { stroke: "#EC4899" } },
    { id: "e4", source: "image-2", target: "lipsync-1", style: { stroke: "#EC4899" } },
    { id: "e5", source: "voice-1", target: "assembly-1", style: { stroke: "#F59E0B" } },
    { id: "e6", source: "lipsync-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e7", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template: Dance/Motion Video (Seedance) ── */
const danceVideo: WorkflowTemplate = {
  id: "tmpl-dance-video",
  name: "Dance / Motion Video",
  description: "Character image → Seedance 2.0 motion video. For dance trends, challenges, dynamic content. Based on ComfyUI Seedance workflow.",
  category: "dance",
  nodes: [
    { id: "char-1", type: "character", position: { x: 0, y: 50 }, data: { name: "Select Character", niche: "", traits: [] } },
    { id: "content-1", type: "content", position: { x: 0, y: 250 }, data: { title: "Dance/motion description", niche: "", platforms: ["TikTok", "Instagram"] } },
    { id: "prompt-1", type: "prompt", position: { x: 280, y: 120 }, data: { prompt: "", status: "idle" } },
    { id: "image-1", type: "imageGen", position: { x: 560, y: 50 }, data: { model: "Nano Banana 2", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 560, y: 250 }, data: { model: "Seedance 2.0", duration: "8s", aspect: "9:16", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 840, y: 150 }, data: { status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1120, y: 150 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "char-1", target: "prompt-1", animated: true, style: { stroke: "#F43F5E" } },
    { id: "e2", source: "content-1", target: "prompt-1", animated: true, style: { stroke: "#6366F1" } },
    { id: "e3", source: "prompt-1", target: "image-1", style: { stroke: "#3B82F6" } },
    { id: "e4", source: "image-1", target: "video-1", style: { stroke: "#10B981" } },
    { id: "e5", source: "video-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e6", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template: FLUX Multi-Reference (Character Consistency) ── */
const fluxMultiRef: WorkflowTemplate = {
  id: "tmpl-flux-multi-ref",
  name: "FLUX Multi-Reference",
  description: "Multiple reference images + LoRA → consistent character in new scenes. Based on ComfyUI FLUX Kontext multi-image workflow.",
  category: "image_gen",
  nodes: [
    { id: "char-1", type: "character", position: { x: 0, y: 100 }, data: { name: "Character", niche: "", referenceImage: "", traits: [] } },
    { id: "content-1", type: "content", position: { x: 0, y: 300 }, data: { title: "Scene description", niche: "" } },
    { id: "image-ref-1", type: "imageGen", position: { x: 280, y: 0 }, data: { model: "Reference Image 1", label: "Ref 1", status: "idle" } },
    { id: "image-ref-2", type: "imageGen", position: { x: 280, y: 180 }, data: { model: "Reference Image 2", label: "Ref 2", status: "idle" } },
    { id: "image-gen", type: "imageGen", position: { x: 560, y: 100 }, data: { model: "FLUX + LoRA", loraId: "", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 840, y: 100 }, data: { type: "image" } },
  ],
  edges: [
    { id: "e1", source: "char-1", target: "image-ref-1", style: { stroke: "#F43F5E" } },
    { id: "e2", source: "char-1", target: "image-ref-2", style: { stroke: "#F43F5E" } },
    { id: "e3", source: "image-ref-1", target: "image-gen", style: { stroke: "#3B82F6" } },
    { id: "e4", source: "image-ref-2", target: "image-gen", style: { stroke: "#3B82F6" } },
    { id: "e5", source: "content-1", target: "image-gen", animated: true, style: { stroke: "#6366F1" } },
    { id: "e6", source: "image-gen", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template: Full Production Pipeline ── */
const fullPipeline: WorkflowTemplate = {
  id: "tmpl-full-pipeline",
  name: "Full Production Pipeline",
  description: "Complete content pipeline: Character → Script → Image + Video + Voice → Lip Sync → Assembly → Preview. The full OpenClaw production flow.",
  category: "full_pipeline",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 180 }, data: { title: "New Content", description: "Enter topic or select from Ideas", niche: "AI", platforms: ["TikTok", "Instagram", "YouTube"] } },
    { id: "char-1", type: "character", position: { x: 0, y: 0 }, data: { name: "Select Character", niche: "AI", traits: ["confident", "witty"] } },
    { id: "prompt-1", type: "prompt", position: { x: 300, y: 120 }, data: { prompt: "", status: "idle" } },
    { id: "image-1", type: "imageGen", position: { x: 600, y: 0 }, data: { model: "Nano Banana 2", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 600, y: 220 }, data: { model: "Veo 3.1", duration: "8s", resolution: "1080p", aspect: "9:16", status: "idle" } },
    { id: "voice-1", type: "voice", position: { x: 600, y: 420 }, data: { engine: "Qwen3-TTS 1.7B", speaker: "serena", status: "idle" } },
    { id: "lipsync-1", type: "lipSync", position: { x: 900, y: 100 }, data: { model: "Kling 3.0", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 1200, y: 200 }, data: { status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1200, y: 0 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "prompt-1", animated: true, style: { stroke: "#8B5CF6" } },
    { id: "e2", source: "char-1", target: "prompt-1", animated: true, style: { stroke: "#F43F5E" } },
    { id: "e3", source: "prompt-1", target: "image-1", style: { stroke: "#3B82F6" } },
    { id: "e4", source: "prompt-1", target: "video-1", style: { stroke: "#10B981" } },
    { id: "e5", source: "prompt-1", target: "voice-1", style: { stroke: "#F59E0B" } },
    { id: "e6", source: "image-1", target: "lipsync-1", style: { stroke: "#EC4899" } },
    { id: "e7", source: "voice-1", target: "lipsync-1", style: { stroke: "#EC4899" } },
    { id: "e8", source: "video-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e9", source: "lipsync-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e10", source: "lipsync-1", target: "preview-1", style: { stroke: "#14B8A6", strokeDasharray: "5,5" } },
  ],
};

/* ── Template: Batch Content Factory ── */
const batchFactory: WorkflowTemplate = {
  id: "tmpl-batch-factory",
  name: "Batch Content Factory",
  description: "Mass produce content: pick trending topics → batch create → run pipelines → schedule posts. The full factory mode.",
  category: "full_pipeline",
  nodes: [
    { id: "char-1", type: "character", position: { x: 0, y: 0 }, data: { name: "AI Model", niche: "AI" } },
    { id: "batch-1", type: "batch", position: { x: 0, y: 200 }, data: { count: 5, mode: "trending", status: "idle" } },
    { id: "prompt-1", type: "prompt", position: { x: 300, y: 50 }, data: { prompt: "Batch script generation", status: "idle" } },
    { id: "prompt-2", type: "prompt", position: { x: 300, y: 200 }, data: { prompt: "Batch script generation", status: "idle" } },
    { id: "prompt-3", type: "prompt", position: { x: 300, y: 350 }, data: { prompt: "Batch script generation", status: "idle" } },
    { id: "image-1", type: "imageGen", position: { x: 580, y: 50 }, data: { model: "Nano Banana 2", status: "idle" } },
    { id: "image-2", type: "imageGen", position: { x: 580, y: 200 }, data: { model: "Nano Banana 2", status: "idle" } },
    { id: "image-3", type: "imageGen", position: { x: 580, y: 350 }, data: { model: "Nano Banana 2", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 860, y: 200 }, data: { type: "image", totalCost: 0 } },
  ],
  edges: [
    { id: "e1", source: "char-1", target: "prompt-1", style: { stroke: "#F43F5E" } },
    { id: "e2", source: "char-1", target: "prompt-2", style: { stroke: "#F43F5E" } },
    { id: "e3", source: "char-1", target: "prompt-3", style: { stroke: "#F43F5E" } },
    { id: "e4", source: "batch-1", target: "prompt-1", style: { stroke: "#8B5CF6" } },
    { id: "e5", source: "batch-1", target: "prompt-2", style: { stroke: "#8B5CF6" } },
    { id: "e6", source: "batch-1", target: "prompt-3", style: { stroke: "#8B5CF6" } },
    { id: "e7", source: "prompt-1", target: "image-1", style: { stroke: "#3B82F6" } },
    { id: "e8", source: "prompt-2", target: "image-2", style: { stroke: "#3B82F6" } },
    { id: "e9", source: "prompt-3", target: "image-3", style: { stroke: "#3B82F6" } },
    { id: "e10", source: "image-1", target: "preview-1", style: { stroke: "#14B8A6" } },
    { id: "e11", source: "image-2", target: "preview-1", style: { stroke: "#14B8A6" } },
    { id: "e12", source: "image-3", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ═══════════════════════════════════════════════════
 * 25 NEW TEMPLATES FROM workflow-templates-catalog.md
 * ═══════════════════════════════════════════════════ */

/* ── Template 1: UGC Talking Head Testimonial ── */
const ugcTalkingHeadTestimonial: WorkflowTemplate = {
  id: "tmpl-ugc-testimonial",
  name: "UGC Talking Head Testimonial",
  description: "Realistic AI customer testimonial — spokesperson image + scripted review + voice + lip sync + captions. Selfie-style, authentic.",
  category: "testimonial",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 0 }, data: { title: "Product image + URL", niche: "", platforms: ["TikTok", "Instagram", "YouTube"] } },
    { id: "prompt-1", type: "prompt", position: { x: 280, y: 0 }, data: { prompt: "Generate authentic testimonial script with hook, review, and CTA", status: "idle" } },
    { id: "image-1", type: "imageGen", position: { x: 560, y: -80 }, data: { model: "Nano Banana 2", label: "Spokesperson Image", status: "idle" } },
    { id: "voice-1", type: "voice", position: { x: 560, y: 100 }, data: { engine: "Qwen3-TTS 1.7B", speaker: "serena", status: "idle" } },
    { id: "lipsync-1", type: "lipSync", position: { x: 840, y: 0 }, data: { model: "Kling 3.0", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 1120, y: 0 }, data: { label: "Caption Overlay + Export", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1400, y: 0 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "prompt-1", animated: true, style: { stroke: "#6366F1" } },
    { id: "e2", source: "prompt-1", target: "image-1", style: { stroke: "#3B82F6" } },
    { id: "e3", source: "prompt-1", target: "voice-1", style: { stroke: "#F59E0B" } },
    { id: "e4", source: "image-1", target: "lipsync-1", style: { stroke: "#EC4899" } },
    { id: "e5", source: "voice-1", target: "lipsync-1", style: { stroke: "#EC4899" } },
    { id: "e6", source: "lipsync-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e7", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 2: Product Scene Transformation ── */
const productSceneTransformation: WorkflowTemplate = {
  id: "tmpl-product-scene-transform",
  name: "Product Scene Transformation",
  description: "Product transforms between environments — studio to beach, kitchen, luxury. Dynamic scene transitions with color grading.",
  category: "product_demo",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 0 }, data: { title: "Product video/image input", niche: "", platforms: ["Instagram", "TikTok"] } },
    { id: "prompt-1", type: "prompt", position: { x: 280, y: 0 }, data: { prompt: "Describe target scene environment", status: "idle" } },
    { id: "image-1", type: "imageGen", position: { x: 560, y: -80 }, data: { model: "Nano Banana 2", label: "Scene Background", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 560, y: 100 }, data: { model: "Veo 3.1", duration: "8s", label: "Scene Transition Video", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 840, y: 0 }, data: { label: "Color Grading + Audio", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1120, y: 0 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "prompt-1", animated: true, style: { stroke: "#6366F1" } },
    { id: "e2", source: "prompt-1", target: "image-1", style: { stroke: "#3B82F6" } },
    { id: "e3", source: "prompt-1", target: "video-1", style: { stroke: "#10B981" } },
    { id: "e4", source: "image-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e5", source: "video-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e6", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 3: Cinematic First-Frame Last-Frame Ad ── */
const cinematicFirstLastFrame: WorkflowTemplate = {
  id: "tmpl-first-last-frame",
  name: "First-Frame Last-Frame Ad",
  description: "Smooth cinematic transition from start image to end image — perfect for before/after reveals, mystery box openings, product transformations.",
  category: "before_after",
  nodes: [
    { id: "image-first", type: "imageGen", position: { x: 0, y: 0 }, data: { model: "Nano Banana 2", label: "First Frame (Before)", status: "idle" } },
    { id: "image-last", type: "imageGen", position: { x: 0, y: 200 }, data: { model: "Nano Banana 2", label: "Last Frame (After)", status: "idle" } },
    { id: "prompt-1", type: "prompt", position: { x: 280, y: 100 }, data: { prompt: "Describe motion/transition style between frames", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 560, y: 100 }, data: { model: "Veo 3.1", duration: "8s", label: "FLF Video Generation", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 840, y: 50 }, data: { label: "Audio + Text Overlay", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1120, y: 50 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "image-first", target: "prompt-1", style: { stroke: "#3B82F6" } },
    { id: "e2", source: "image-last", target: "prompt-1", style: { stroke: "#8B5CF6" } },
    { id: "e3", source: "prompt-1", target: "video-1", animated: true, style: { stroke: "#10B981" } },
    { id: "e4", source: "video-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e5", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 4: Automated Multi-Platform Video Campaign ── */
const multiPlatformCampaign: WorkflowTemplate = {
  id: "tmpl-multi-platform-campaign",
  name: "Multi-Platform Video Campaign",
  description: "End-to-end: idea from brief → full video with visuals + voiceover + captions → auto-publish to TikTok, Instagram, YouTube, Facebook, LinkedIn.",
  category: "full_campaign",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 100 }, data: { title: "Campaign brief + product details", niche: "", platforms: ["TikTok", "Instagram", "YouTube", "Facebook", "LinkedIn"] } },
    { id: "prompt-1", type: "prompt", position: { x: 280, y: 100 }, data: { prompt: "Video script + image prompts + platform descriptions", status: "idle" } },
    { id: "image-1", type: "imageGen", position: { x: 560, y: 0 }, data: { model: "Nano Banana 2", label: "Visual Frames", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 560, y: 160 }, data: { model: "Veo 3.1", duration: "15s", status: "idle" } },
    { id: "voice-1", type: "voice", position: { x: 560, y: 320 }, data: { engine: "Qwen3-TTS 1.7B", speaker: "serena", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 840, y: 100 }, data: { label: "Clips + Audio + Captions", status: "idle" } },
    { id: "batch-1", type: "batch", position: { x: 1120, y: 100 }, data: { count: 5, mode: "platform-optimize", label: "Multi-Platform Publish", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1400, y: 100 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "prompt-1", animated: true, style: { stroke: "#6366F1" } },
    { id: "e2", source: "prompt-1", target: "image-1", style: { stroke: "#3B82F6" } },
    { id: "e3", source: "prompt-1", target: "video-1", style: { stroke: "#10B981" } },
    { id: "e4", source: "prompt-1", target: "voice-1", style: { stroke: "#F59E0B" } },
    { id: "e5", source: "image-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e6", source: "video-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e7", source: "voice-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e8", source: "assembly-1", target: "batch-1", style: { stroke: "#8B5CF6" } },
    { id: "e9", source: "batch-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 5: Product Photography Ad Poster ── */
const productPhotoAdPoster: WorkflowTemplate = {
  id: "tmpl-product-photo-poster",
  name: "Product Photography Ad Poster",
  description: "Professional ad poster — product extracted, placed in generated scene with studio lighting, shadows, and branding. Print-ready and social-ready.",
  category: "product_photo",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 0 }, data: { title: "Product image upload", niche: "", platforms: ["Instagram", "Facebook"] } },
    { id: "image-mask", type: "imageGen", position: { x: 280, y: -80 }, data: { model: "Nano Banana 2", label: "Product Masking", status: "idle" } },
    { id: "image-bg", type: "imageGen", position: { x: 280, y: 100 }, data: { model: "Nano Banana 2", label: "Background Scene", status: "idle" } },
    { id: "image-composite", type: "imageGen", position: { x: 560, y: 0 }, data: { model: "Nano Banana 2", label: "Lighting + Composite", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 840, y: 0 }, data: { label: "Text/Logo Overlay", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1120, y: 0 }, data: { type: "image" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "image-mask", style: { stroke: "#3B82F6" } },
    { id: "e2", source: "content-1", target: "image-bg", style: { stroke: "#6366F1" } },
    { id: "e3", source: "image-mask", target: "image-composite", style: { stroke: "#EC4899" } },
    { id: "e4", source: "image-bg", target: "image-composite", style: { stroke: "#EC4899" } },
    { id: "e5", source: "image-composite", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e6", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 6: Branding Product Shot (SeedDream) ── */
const brandingProductShot: WorkflowTemplate = {
  id: "tmpl-branding-product-shot",
  name: "Branding Product Shot",
  description: "Product shot with brand logo/label overlaid — AI wraps labels around surfaces realistically. Branded product mockups.",
  category: "product_photo",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 0 }, data: { title: "Product image upload", niche: "" } },
    { id: "content-2", type: "content", position: { x: 0, y: 180 }, data: { title: "Logo/label upload", niche: "" } },
    { id: "image-1", type: "imageGen", position: { x: 300, y: 80 }, data: { model: "Nano Banana 2", label: "Dual-Input Branding", status: "idle" } },
    { id: "image-2", type: "imageGen", position: { x: 580, y: 80 }, data: { model: "Nano Banana 2", label: "Scene Enhancement", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 860, y: 80 }, data: { type: "image" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "image-1", style: { stroke: "#3B82F6" } },
    { id: "e2", source: "content-2", target: "image-1", style: { stroke: "#F43F5E" } },
    { id: "e3", source: "image-1", target: "image-2", style: { stroke: "#EC4899" } },
    { id: "e4", source: "image-2", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 7: Product Image to Hero Shot ── */
const productHeroShot: WorkflowTemplate = {
  id: "tmpl-product-hero-shot",
  name: "Product Image to Hero Shot",
  description: "Transform basic product photo into dramatic hero shot — enhanced lighting, professional shadows, depth effects, polished backgrounds.",
  category: "ecommerce",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 80 }, data: { title: "Product photo upload", niche: "", platforms: ["Instagram", "Shopify"] } },
    { id: "image-encode", type: "imageGen", position: { x: 280, y: 0 }, data: { model: "Nano Banana 2", label: "Image Encoding", status: "idle" } },
    { id: "image-mask", type: "imageGen", position: { x: 280, y: 180 }, data: { model: "Nano Banana 2", label: "Mask Generation", status: "idle" } },
    { id: "image-light", type: "imageGen", position: { x: 560, y: 0 }, data: { model: "Nano Banana 2", label: "Lighting Enhancement", status: "idle" } },
    { id: "image-bg", type: "imageGen", position: { x: 560, y: 180 }, data: { model: "Nano Banana 2", label: "Background Enhancement", status: "idle" } },
    { id: "image-final", type: "imageGen", position: { x: 840, y: 80 }, data: { model: "Nano Banana 2", label: "Final Decode + Refine", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1120, y: 80 }, data: { type: "image" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "image-encode", style: { stroke: "#3B82F6" } },
    { id: "e2", source: "content-1", target: "image-mask", style: { stroke: "#6366F1" } },
    { id: "e3", source: "image-encode", target: "image-light", style: { stroke: "#EC4899" } },
    { id: "e4", source: "image-mask", target: "image-bg", style: { stroke: "#8B5CF6" } },
    { id: "e5", source: "image-light", target: "image-final", style: { stroke: "#6B7280" } },
    { id: "e6", source: "image-bg", target: "image-final", style: { stroke: "#6B7280" } },
    { id: "e7", source: "image-final", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 8: Ad Poster/Asset Generator ── */
const adPosterGenerator: WorkflowTemplate = {
  id: "tmpl-ad-poster-generator",
  name: "Ad Poster / Asset Generator",
  description: "Complete ad poster — upload product, describe style, generate layout, swap product in, add text + logo. Iterate on design.",
  category: "product_photo",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 0 }, data: { title: "Product image", niche: "" } },
    { id: "prompt-1", type: "prompt", position: { x: 0, y: 180 }, data: { prompt: "Describe poster style, theme, mood", status: "idle" } },
    { id: "image-layout", type: "imageGen", position: { x: 300, y: 0 }, data: { model: "Nano Banana 2", label: "Layout Generation", status: "idle" } },
    { id: "image-integrate", type: "imageGen", position: { x: 580, y: 0 }, data: { model: "Nano Banana 2", label: "Product Integration", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 860, y: 0 }, data: { label: "Text + Logo Placement", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1140, y: 0 }, data: { type: "image" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "image-layout", style: { stroke: "#3B82F6" } },
    { id: "e2", source: "prompt-1", target: "image-layout", animated: true, style: { stroke: "#6366F1" } },
    { id: "e3", source: "image-layout", target: "image-integrate", style: { stroke: "#EC4899" } },
    { id: "e4", source: "content-1", target: "image-integrate", style: { stroke: "#F43F5E", strokeDasharray: "5,5" } },
    { id: "e5", source: "image-integrate", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e6", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 9: Faceless Explainer Video ── */
const facelessExplainer: WorkflowTemplate = {
  id: "tmpl-faceless-explainer",
  name: "Faceless Explainer Video",
  description: "Professional explainer/educational video — AI visuals + voiceover narration + captions. No human presenter needed. Great for tutorials and how-tos.",
  category: "tutorial",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 100 }, data: { title: "Topic + key features + audience", niche: "", platforms: ["YouTube", "TikTok", "Instagram"] } },
    { id: "prompt-1", type: "prompt", position: { x: 280, y: 100 }, data: { prompt: "60-second educational script", status: "idle" } },
    { id: "image-1", type: "imageGen", position: { x: 560, y: 0 }, data: { model: "Nano Banana 2", label: "Scene Visuals", status: "idle" } },
    { id: "image-2", type: "imageGen", position: { x: 560, y: 160 }, data: { model: "Nano Banana 2", label: "Scene Visuals 2", status: "idle" } },
    { id: "voice-1", type: "voice", position: { x: 560, y: 320 }, data: { engine: "Qwen3-TTS 1.7B", speaker: "serena", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 840, y: 100 }, data: { label: "Images + Audio + Captions w/ Timing", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1120, y: 100 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "prompt-1", animated: true, style: { stroke: "#6366F1" } },
    { id: "e2", source: "prompt-1", target: "image-1", style: { stroke: "#3B82F6" } },
    { id: "e3", source: "prompt-1", target: "image-2", style: { stroke: "#3B82F6" } },
    { id: "e4", source: "prompt-1", target: "voice-1", style: { stroke: "#F59E0B" } },
    { id: "e5", source: "image-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e6", source: "image-2", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e7", source: "voice-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e8", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 10: 3D Product Video from 2D Image ── */
const product3DFromImage: WorkflowTemplate = {
  id: "tmpl-3d-product-video",
  name: "3D Product Video from 2D",
  description: "Convert flat 2D product image into rotating 3D product showcase video — spin, zoom, multi-angle display without 3D models.",
  category: "ecommerce",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 80 }, data: { title: "2D product photo + name", niche: "", platforms: ["Shopify", "Instagram"] } },
    { id: "image-clean", type: "imageGen", position: { x: 280, y: 0 }, data: { model: "Nano Banana 2", label: "Background Removal", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 560, y: 0 }, data: { model: "Veo 3.1", duration: "8s", label: "3D Rotation Video", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 840, y: 0 }, data: { label: "Storage + Notification", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1120, y: 0 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "image-clean", style: { stroke: "#3B82F6" } },
    { id: "e2", source: "image-clean", target: "video-1", animated: true, style: { stroke: "#10B981" } },
    { id: "e3", source: "video-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e4", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 11: UGC Walk-and-Talk Testimonial ── */
const ugcWalkAndTalk: WorkflowTemplate = {
  id: "tmpl-ugc-walk-and-talk",
  name: "UGC Walk-and-Talk (3 Variants)",
  description: "Three 15-sec UGC-style ads with consistent AI character — on-the-go testimonial, driver's seat review, at-home demo. Product research-driven scripts.",
  category: "ugc_ad",
  nodes: [
    { id: "char-1", type: "character", position: { x: 0, y: 0 }, data: { name: "UGC Character", niche: "", traits: ["casual", "authentic"] } },
    { id: "content-1", type: "content", position: { x: 0, y: 200 }, data: { title: "Product image + URL for research", niche: "" } },
    { id: "prompt-1", type: "prompt", position: { x: 300, y: 0 }, data: { prompt: "Script A: On-the-Go Testimonial", status: "idle" } },
    { id: "prompt-2", type: "prompt", position: { x: 300, y: 160 }, data: { prompt: "Script B: Driver's Seat Review", status: "idle" } },
    { id: "prompt-3", type: "prompt", position: { x: 300, y: 320 }, data: { prompt: "Script C: At-Home Demo", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 600, y: 0 }, data: { model: "Veo 3.1", duration: "15s", label: "Video A", status: "idle" } },
    { id: "video-2", type: "videoGen", position: { x: 600, y: 160 }, data: { model: "Veo 3.1", duration: "15s", label: "Video B", status: "idle" } },
    { id: "video-3", type: "videoGen", position: { x: 600, y: 320 }, data: { model: "Veo 3.1", duration: "15s", label: "Video C", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 900, y: 160 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "char-1", target: "prompt-1", style: { stroke: "#F43F5E" } },
    { id: "e2", source: "char-1", target: "prompt-2", style: { stroke: "#F43F5E" } },
    { id: "e3", source: "char-1", target: "prompt-3", style: { stroke: "#F43F5E" } },
    { id: "e4", source: "content-1", target: "prompt-1", style: { stroke: "#6366F1" } },
    { id: "e5", source: "content-1", target: "prompt-2", style: { stroke: "#6366F1" } },
    { id: "e6", source: "content-1", target: "prompt-3", style: { stroke: "#6366F1" } },
    { id: "e7", source: "prompt-1", target: "video-1", style: { stroke: "#10B981" } },
    { id: "e8", source: "prompt-2", target: "video-2", style: { stroke: "#10B981" } },
    { id: "e9", source: "prompt-3", target: "video-3", style: { stroke: "#10B981" } },
    { id: "e10", source: "video-1", target: "preview-1", style: { stroke: "#14B8A6" } },
    { id: "e11", source: "video-2", target: "preview-1", style: { stroke: "#14B8A6" } },
    { id: "e12", source: "video-3", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 12: Eye-Catching Product Video Ad ── */
const eyeCatchingProductAd: WorkflowTemplate = {
  id: "tmpl-eye-catching-product-ad",
  name: "Eye-Catching Product Video Ad",
  description: "Dynamic video ad from static product image — product placed in matching scene with lighting, style extraction, and motion effects.",
  category: "product_demo",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 0 }, data: { title: "Product image", niche: "" } },
    { id: "content-2", type: "content", position: { x: 0, y: 180 }, data: { title: "Style reference image", niche: "" } },
    { id: "image-mask", type: "imageGen", position: { x: 280, y: 0 }, data: { model: "Nano Banana 2", label: "Smart Masking", status: "idle" } },
    { id: "image-style", type: "imageGen", position: { x: 280, y: 180 }, data: { model: "Nano Banana 2", label: "Style Extraction", status: "idle" } },
    { id: "image-composite", type: "imageGen", position: { x: 560, y: 80 }, data: { model: "Nano Banana 2", label: "Lighting + Composite", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 840, y: 80 }, data: { model: "Veo 3.1", duration: "8s", label: "Animation", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1120, y: 80 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "image-mask", style: { stroke: "#3B82F6" } },
    { id: "e2", source: "content-2", target: "image-style", style: { stroke: "#8B5CF6" } },
    { id: "e3", source: "image-mask", target: "image-composite", style: { stroke: "#EC4899" } },
    { id: "e4", source: "image-style", target: "image-composite", style: { stroke: "#EC4899" } },
    { id: "e5", source: "image-composite", target: "video-1", animated: true, style: { stroke: "#10B981" } },
    { id: "e6", source: "video-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 13: Cinematic Video Ad Campaign ── */
const cinematicAdCampaign: WorkflowTemplate = {
  id: "tmpl-cinematic-ad-campaign",
  name: "Cinematic Video Ad Campaign",
  description: "Polished cinematic ads — scripts, multiple video clips with dual models for A/B testing, merged into final ad, auto-published across platforms.",
  category: "full_campaign",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 120 }, data: { title: "Campaign brief: product, audience, goals", niche: "", platforms: ["TikTok", "Instagram", "YouTube", "Facebook"] } },
    { id: "prompt-1", type: "prompt", position: { x: 280, y: 120 }, data: { prompt: "Ad script with scene breakdowns", status: "idle" } },
    { id: "image-1", type: "imageGen", position: { x: 560, y: 0 }, data: { model: "Nano Banana 2", label: "Key Frames", status: "idle" } },
    { id: "video-a", type: "videoGen", position: { x: 560, y: 150 }, data: { model: "Veo 3.1", duration: "15s", label: "Video A (Primary)", status: "idle" } },
    { id: "video-b", type: "videoGen", position: { x: 560, y: 300 }, data: { model: "Veo 3.1", duration: "15s", label: "Video B (A/B Test)", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 840, y: 120 }, data: { label: "Video Merge + Best Clips", status: "idle" } },
    { id: "batch-1", type: "batch", position: { x: 1120, y: 120 }, data: { count: 4, mode: "platform-publish", label: "Multi-Platform Publish", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1400, y: 120 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "prompt-1", animated: true, style: { stroke: "#6366F1" } },
    { id: "e2", source: "prompt-1", target: "image-1", style: { stroke: "#3B82F6" } },
    { id: "e3", source: "prompt-1", target: "video-a", style: { stroke: "#10B981" } },
    { id: "e4", source: "prompt-1", target: "video-b", style: { stroke: "#F59E0B" } },
    { id: "e5", source: "image-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e6", source: "video-a", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e7", source: "video-b", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e8", source: "assembly-1", target: "batch-1", style: { stroke: "#8B5CF6" } },
    { id: "e9", source: "batch-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 14: Talking Avatar Product Presenter ── */
const talkingAvatarPresenter: WorkflowTemplate = {
  id: "tmpl-talking-avatar-presenter",
  name: "Talking Avatar Presenter",
  description: "AI avatar talking-head — photo → animated presenter delivering product pitch with lip-sync, expressions, and auto-optimized post title.",
  category: "testimonial",
  nodes: [
    { id: "char-1", type: "character", position: { x: 0, y: 0 }, data: { name: "Avatar Presenter", niche: "", traits: ["enthusiastic", "professional"] } },
    { id: "prompt-1", type: "prompt", position: { x: 280, y: 0 }, data: { prompt: "Product pitch script + expression guide", status: "idle" } },
    { id: "voice-1", type: "voice", position: { x: 280, y: 180 }, data: { engine: "Qwen3-TTS 1.7B", speaker: "serena", status: "idle" } },
    { id: "image-1", type: "imageGen", position: { x: 560, y: 0 }, data: { model: "Nano Banana 2", label: "Avatar Image", status: "idle" } },
    { id: "lipsync-1", type: "lipSync", position: { x: 560, y: 180 }, data: { model: "Kling 3.0", label: "Avatar Animation", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 840, y: 80 }, data: { label: "Title Generation + Publish", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1120, y: 80 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "char-1", target: "prompt-1", animated: true, style: { stroke: "#F43F5E" } },
    { id: "e2", source: "prompt-1", target: "voice-1", style: { stroke: "#F59E0B" } },
    { id: "e3", source: "char-1", target: "image-1", style: { stroke: "#3B82F6" } },
    { id: "e4", source: "image-1", target: "lipsync-1", style: { stroke: "#EC4899" } },
    { id: "e5", source: "voice-1", target: "lipsync-1", style: { stroke: "#EC4899" } },
    { id: "e6", source: "lipsync-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e7", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 15: Ultimate Modular Marketing Workflow ── */
const modularMarketing: WorkflowTemplate = {
  id: "tmpl-modular-marketing",
  name: "Modular Marketing Assets",
  description: "Flexible asset creator — composite AI-generated elements on custom backgrounds. Supports blog images, social posts, product shots, watermarks.",
  category: "product_photo",
  nodes: [
    { id: "prompt-fg", type: "prompt", position: { x: 0, y: 0 }, data: { prompt: "Foreground element prompt (product/logo/person)", status: "idle" } },
    { id: "prompt-bg", type: "prompt", position: { x: 0, y: 200 }, data: { prompt: "Background scene prompt", status: "idle" } },
    { id: "image-fg", type: "imageGen", position: { x: 300, y: 0 }, data: { model: "Nano Banana 2", label: "Foreground Generation", status: "idle" } },
    { id: "image-bg", type: "imageGen", position: { x: 300, y: 200 }, data: { model: "Nano Banana 2", label: "Background Generation", status: "idle" } },
    { id: "image-composite", type: "imageGen", position: { x: 600, y: 80 }, data: { model: "Nano Banana 2", label: "Compositing + Masking", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 880, y: 80 }, data: { label: "Logo/Watermark Overlay", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1160, y: 80 }, data: { type: "image" } },
  ],
  edges: [
    { id: "e1", source: "prompt-fg", target: "image-fg", style: { stroke: "#3B82F6" } },
    { id: "e2", source: "prompt-bg", target: "image-bg", style: { stroke: "#8B5CF6" } },
    { id: "e3", source: "image-fg", target: "image-composite", style: { stroke: "#EC4899" } },
    { id: "e4", source: "image-bg", target: "image-composite", style: { stroke: "#EC4899" } },
    { id: "e5", source: "image-composite", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e6", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 16: Multimodal Product Ad Pipeline ── */
const multimodalAdPipeline: WorkflowTemplate = {
  id: "tmpl-multimodal-ad-pipeline",
  name: "Multimodal Product Ad Pipeline",
  description: "Complete ad package — hero images, lifestyle shots, 6-8 sec video clips, and voiceover. All visually consistent via shared brand nucleus.",
  category: "full_campaign",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 0 }, data: { title: "Brand Nucleus: style board, palette, descriptor", niche: "" } },
    { id: "content-2", type: "content", position: { x: 0, y: 200 }, data: { title: "Product photo + 2 reference compositions", niche: "" } },
    { id: "image-hero", type: "imageGen", position: { x: 320, y: 0 }, data: { model: "Nano Banana 2", label: "Hero Image", status: "idle" } },
    { id: "image-lifestyle", type: "imageGen", position: { x: 320, y: 160 }, data: { model: "Nano Banana 2", label: "Lifestyle Shot", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 320, y: 320 }, data: { model: "Veo 3.1", duration: "8s", label: "Product Video", status: "idle" } },
    { id: "voice-1", type: "voice", position: { x: 620, y: 320 }, data: { engine: "Qwen3-TTS 1.7B", speaker: "serena", label: "Brand Voiceover", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 620, y: 80 }, data: { label: "Consistency Check + Bundle", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 920, y: 80 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "image-hero", style: { stroke: "#3B82F6" } },
    { id: "e2", source: "content-1", target: "image-lifestyle", style: { stroke: "#6366F1" } },
    { id: "e3", source: "content-2", target: "image-hero", style: { stroke: "#F43F5E" } },
    { id: "e4", source: "content-2", target: "image-lifestyle", style: { stroke: "#F43F5E" } },
    { id: "e5", source: "content-2", target: "video-1", style: { stroke: "#10B981" } },
    { id: "e6", source: "video-1", target: "voice-1", style: { stroke: "#F59E0B" } },
    { id: "e7", source: "image-hero", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e8", source: "image-lifestyle", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e9", source: "voice-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e10", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 17: UGC E-Commerce Video from Sheets ── */
const ugcEcommerceBatch: WorkflowTemplate = {
  id: "tmpl-ugc-ecommerce-batch",
  name: "UGC E-Commerce Batch",
  description: "Automated UGC ads at scale from product spreadsheet — each row generates script, enhanced image, and UGC-style video automatically.",
  category: "ugc_ad",
  nodes: [
    { id: "batch-1", type: "batch", position: { x: 0, y: 80 }, data: { count: 10, mode: "spreadsheet", label: "Product Catalog Input", status: "idle" } },
    { id: "prompt-1", type: "prompt", position: { x: 280, y: 0 }, data: { prompt: "UGC ad script per product", status: "idle" } },
    { id: "image-1", type: "imageGen", position: { x: 280, y: 180 }, data: { model: "Nano Banana 2", label: "Product Enhancement", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 560, y: 80 }, data: { model: "Veo 3.1", duration: "15s", label: "UGC Video per Product", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 840, y: 80 }, data: { label: "Batch Compile + QA", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1120, y: 80 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "batch-1", target: "prompt-1", style: { stroke: "#8B5CF6" } },
    { id: "e2", source: "batch-1", target: "image-1", style: { stroke: "#3B82F6" } },
    { id: "e3", source: "prompt-1", target: "video-1", style: { stroke: "#10B981" } },
    { id: "e4", source: "image-1", target: "video-1", style: { stroke: "#EC4899" } },
    { id: "e5", source: "video-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e6", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 18: Product Video from Product Images ── */
const autoCommercial: WorkflowTemplate = {
  id: "tmpl-auto-commercial",
  name: "Auto-Commercial from Images",
  description: "Full commercial from product images — AI analyzes product, writes script, generates scenes, adds voiceover, produces ready-to-run video ad.",
  category: "product_demo",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 100 }, data: { title: "Product photos upload", niche: "", platforms: ["YouTube", "TikTok", "Instagram", "Facebook"] } },
    { id: "prompt-analysis", type: "prompt", position: { x: 280, y: 0 }, data: { prompt: "Product Analysis: features, colors, category", status: "idle" } },
    { id: "prompt-script", type: "prompt", position: { x: 280, y: 180 }, data: { prompt: "Commercial script from analysis", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 560, y: 0 }, data: { model: "Veo 3.1", duration: "15s", label: "Scene Clips", status: "idle" } },
    { id: "voice-1", type: "voice", position: { x: 560, y: 180 }, data: { engine: "Qwen3-TTS 1.7B", speaker: "serena", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 840, y: 80 }, data: { label: "Video Merge + Music + SFX", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1120, y: 80 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "prompt-analysis", animated: true, style: { stroke: "#6366F1" } },
    { id: "e2", source: "prompt-analysis", target: "prompt-script", style: { stroke: "#8B5CF6" } },
    { id: "e3", source: "prompt-script", target: "video-1", style: { stroke: "#10B981" } },
    { id: "e4", source: "prompt-script", target: "voice-1", style: { stroke: "#F59E0B" } },
    { id: "e5", source: "video-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e6", source: "voice-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e7", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 19: AI Ad Creator (VLM) ── */
const aiAdCreatorVLM: WorkflowTemplate = {
  id: "tmpl-ai-ad-creator-vlm",
  name: "AI Ad Creator (VLM)",
  description: "Campaign materials from Visual Language Model — enter parameters, AI generates ad concepts, copy, and visuals. Multi-language support.",
  category: "full_campaign",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 0 }, data: { title: "Campaign: product, audience, goals, brand guidelines", niche: "", platforms: ["All"] } },
    { id: "prompt-1", type: "prompt", position: { x: 300, y: 0 }, data: { prompt: "VLM: analyze inputs, generate creative direction", status: "idle" } },
    { id: "prompt-copy", type: "prompt", position: { x: 600, y: -80 }, data: { prompt: "Ad Copy: headlines, body text, CTAs", status: "idle" } },
    { id: "image-1", type: "imageGen", position: { x: 600, y: 80 }, data: { model: "Nano Banana 2", label: "Ad Visuals", status: "idle" } },
    { id: "prompt-translate", type: "prompt", position: { x: 900, y: -80 }, data: { prompt: "Translation (optional)", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 900, y: 80 }, data: { label: "Review + Export", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1180, y: 0 }, data: { type: "image" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "prompt-1", animated: true, style: { stroke: "#6366F1" } },
    { id: "e2", source: "prompt-1", target: "prompt-copy", style: { stroke: "#F59E0B" } },
    { id: "e3", source: "prompt-1", target: "image-1", style: { stroke: "#3B82F6" } },
    { id: "e4", source: "prompt-copy", target: "prompt-translate", style: { stroke: "#8B5CF6" } },
    { id: "e5", source: "image-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e6", source: "prompt-translate", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e7", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 20: Logo & Brand Asset Animator ── */
const logoBrandAnimator: WorkflowTemplate = {
  id: "tmpl-logo-brand-animator",
  name: "Logo & Brand Animator",
  description: "Animated brand assets — static logo + texture (plush, metal, glass) → textured logo → animated reveal video. For intros, outros, social posts.",
  category: "brand_animation",
  nodes: [
    { id: "content-logo", type: "content", position: { x: 0, y: 0 }, data: { title: "Logo/logotype image", niche: "" } },
    { id: "content-texture", type: "content", position: { x: 0, y: 180 }, data: { title: "Texture reference (leather, chrome, fabric)", niche: "" } },
    { id: "image-textured", type: "imageGen", position: { x: 300, y: 0 }, data: { model: "Nano Banana 2", label: "Texture Application", status: "idle" } },
    { id: "image-elements", type: "imageGen", position: { x: 300, y: 180 }, data: { model: "Nano Banana 2", label: "Element Compositing", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 600, y: 80 }, data: { model: "Veo 3.1", duration: "5s", label: "Logo Reveal Animation", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 900, y: 80 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "content-logo", target: "image-textured", style: { stroke: "#3B82F6" } },
    { id: "e2", source: "content-texture", target: "image-textured", style: { stroke: "#F43F5E" } },
    { id: "e3", source: "image-textured", target: "image-elements", style: { stroke: "#EC4899" } },
    { id: "e4", source: "content-texture", target: "image-elements", style: { stroke: "#8B5CF6", strokeDasharray: "5,5" } },
    { id: "e5", source: "image-elements", target: "video-1", animated: true, style: { stroke: "#10B981" } },
    { id: "e6", source: "video-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 21: Day-in-the-Life Product Placement ── */
const dayInTheLife: WorkflowTemplate = {
  id: "tmpl-day-in-life",
  name: "Day-in-the-Life Placement",
  description: "Lifestyle content with product naturally integrated — AI person using product in morning routine, gym, office, cooking. Authentic feel.",
  category: "day_in_life",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 0 }, data: { title: "Product image + name + category", niche: "", platforms: ["TikTok", "Instagram"] } },
    { id: "char-1", type: "character", position: { x: 0, y: 200 }, data: { name: "Target Persona", niche: "", traits: ["relatable", "authentic"] } },
    { id: "prompt-scenario", type: "prompt", position: { x: 300, y: 0 }, data: { prompt: "Lifestyle scenario: morning routine, gym, office, cooking", status: "idle" } },
    { id: "prompt-script", type: "prompt", position: { x: 300, y: 180 }, data: { prompt: "Authentic day-in-the-life narrative", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 600, y: 0 }, data: { model: "Veo 3.1", duration: "15s", label: "Lifestyle Clips", status: "idle" } },
    { id: "voice-1", type: "voice", position: { x: 600, y: 180 }, data: { engine: "Qwen3-TTS 1.7B", speaker: "serena", label: "Casual Narration", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 900, y: 80 }, data: { label: "Music + Captions + Export", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1200, y: 80 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "prompt-scenario", style: { stroke: "#6366F1" } },
    { id: "e2", source: "char-1", target: "prompt-script", style: { stroke: "#F43F5E" } },
    { id: "e3", source: "prompt-scenario", target: "prompt-script", animated: true, style: { stroke: "#8B5CF6" } },
    { id: "e4", source: "prompt-script", target: "video-1", style: { stroke: "#10B981" } },
    { id: "e5", source: "prompt-script", target: "voice-1", style: { stroke: "#F59E0B" } },
    { id: "e6", source: "video-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e7", source: "voice-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e8", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 22: Unboxing Video Generator ── */
const unboxingVideo: WorkflowTemplate = {
  id: "tmpl-unboxing-video",
  name: "Unboxing Video Generator",
  description: "AI unboxing experience — package arriving, opening, product reveal with excitement. Mimics popular unboxing creator style.",
  category: "unboxing",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 100 }, data: { title: "Product image + packaging image", niche: "", platforms: ["TikTok", "YouTube", "Instagram"] } },
    { id: "prompt-1", type: "prompt", position: { x: 280, y: 100 }, data: { prompt: "Unboxing narration with excitement beats", status: "idle" } },
    { id: "image-first", type: "imageGen", position: { x: 560, y: 0 }, data: { model: "Nano Banana 2", label: "First Frame: Package Arrival", status: "idle" } },
    { id: "image-last", type: "imageGen", position: { x: 560, y: 200 }, data: { model: "Nano Banana 2", label: "Last Frame: Product Revealed", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 840, y: 100 }, data: { model: "Veo 3.1", duration: "10s", label: "Unboxing Motion (FLF)", status: "idle" } },
    { id: "voice-1", type: "voice", position: { x: 840, y: 280 }, data: { engine: "Qwen3-TTS 1.7B", speaker: "serena", label: "Excited Narration", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 1120, y: 100 }, data: { label: "Reactions + SFX + Export", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1400, y: 100 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "prompt-1", animated: true, style: { stroke: "#6366F1" } },
    { id: "e2", source: "prompt-1", target: "image-first", style: { stroke: "#3B82F6" } },
    { id: "e3", source: "prompt-1", target: "image-last", style: { stroke: "#8B5CF6" } },
    { id: "e4", source: "image-first", target: "video-1", style: { stroke: "#10B981" } },
    { id: "e5", source: "image-last", target: "video-1", style: { stroke: "#10B981" } },
    { id: "e6", source: "prompt-1", target: "voice-1", style: { stroke: "#F59E0B" } },
    { id: "e7", source: "video-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e8", source: "voice-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e9", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 23: Product Video Auto-Animator ── */
const productAutoAnimator: WorkflowTemplate = {
  id: "tmpl-product-auto-animator",
  name: "Product Auto-Animator",
  description: "Automatically animate static e-commerce photos into short video clips — motion, camera movement, dynamic lighting. Catalog images come alive.",
  category: "ecommerce",
  nodes: [
    { id: "batch-1", type: "batch", position: { x: 0, y: 80 }, data: { count: 10, mode: "spreadsheet", label: "Product Catalog (Sheets)", status: "idle" } },
    { id: "image-1", type: "imageGen", position: { x: 280, y: 0 }, data: { model: "Nano Banana 2", label: "Image Enhancement", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 560, y: 0 }, data: { model: "Veo 3.1", duration: "8s", label: "Animation Generation", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 840, y: 0 }, data: { label: "Storage + Batch Export", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1120, y: 0 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "batch-1", target: "image-1", style: { stroke: "#8B5CF6" } },
    { id: "e2", source: "image-1", target: "video-1", animated: true, style: { stroke: "#10B981" } },
    { id: "e3", source: "video-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e4", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 24: Consistent Multi-Shot Photography ── */
const multiShotPhotography: WorkflowTemplate = {
  id: "tmpl-multi-shot-photography",
  name: "Consistent Multi-Shot Photography",
  description: "Multiple consistent product shots from single input — different angles, settings, maintaining visual consistency. Full photo set without a photoshoot.",
  category: "product_photo",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 100 }, data: { title: "Single product reference photo", niche: "", platforms: ["Shopify", "Amazon", "Instagram"] } },
    { id: "prompt-1", type: "prompt", position: { x: 280, y: 100 }, data: { prompt: "Angle/shot selection: front, side, top-down, lifestyle, close-up", status: "idle" } },
    { id: "image-front", type: "imageGen", position: { x: 560, y: -40 }, data: { model: "Nano Banana 2", label: "Front View", status: "idle" } },
    { id: "image-side", type: "imageGen", position: { x: 560, y: 80 }, data: { model: "Nano Banana 2", label: "Side View", status: "idle" } },
    { id: "image-top", type: "imageGen", position: { x: 560, y: 200 }, data: { model: "Nano Banana 2", label: "Top-Down View", status: "idle" } },
    { id: "image-lifestyle", type: "imageGen", position: { x: 560, y: 320 }, data: { model: "Nano Banana 2", label: "Lifestyle Shot", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 860, y: 100 }, data: { label: "Color Calibration + Export Set", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1140, y: 100 }, data: { type: "image" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "prompt-1", animated: true, style: { stroke: "#6366F1" } },
    { id: "e2", source: "prompt-1", target: "image-front", style: { stroke: "#3B82F6" } },
    { id: "e3", source: "prompt-1", target: "image-side", style: { stroke: "#3B82F6" } },
    { id: "e4", source: "prompt-1", target: "image-top", style: { stroke: "#3B82F6" } },
    { id: "e5", source: "prompt-1", target: "image-lifestyle", style: { stroke: "#3B82F6" } },
    { id: "e6", source: "image-front", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e7", source: "image-side", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e8", source: "image-top", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e9", source: "image-lifestyle", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e10", source: "assembly-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ── Template 25: Short-Form POV Content Generator ── */
const shortFormPOV: WorkflowTemplate = {
  id: "tmpl-short-form-pov",
  name: "Short-Form POV Content",
  description: "First-person POV short-form videos — viewer sees product experience from their perspective. Popular for food, beauty, fashion, tech.",
  category: "ugc_ad",
  nodes: [
    { id: "content-1", type: "content", position: { x: 0, y: 100 }, data: { title: "Product + POV scenario + mood", niche: "", platforms: ["TikTok", "Instagram", "YouTube"] } },
    { id: "prompt-1", type: "prompt", position: { x: 280, y: 100 }, data: { prompt: "POV narrative with scene directions", status: "idle" } },
    { id: "image-1", type: "imageGen", position: { x: 560, y: 0 }, data: { model: "Nano Banana 2", label: "POV Scene Images", status: "idle" } },
    { id: "video-1", type: "videoGen", position: { x: 560, y: 160 }, data: { model: "Veo 3.1", duration: "15s", label: "POV Camera Motion", status: "idle" } },
    { id: "voice-1", type: "voice", position: { x: 560, y: 320 }, data: { engine: "Qwen3-TTS 1.7B", speaker: "serena", label: "Internal Monologue", status: "idle" } },
    { id: "assembly-1", type: "assembly", position: { x: 840, y: 100 }, data: { label: "Captions + Transitions + Assembly", status: "idle" } },
    { id: "batch-1", type: "batch", position: { x: 1120, y: 100 }, data: { count: 3, mode: "platform-publish", label: "Multi-Platform Publish", status: "idle" } },
    { id: "preview-1", type: "preview", position: { x: 1400, y: 100 }, data: { type: "video" } },
  ],
  edges: [
    { id: "e1", source: "content-1", target: "prompt-1", animated: true, style: { stroke: "#6366F1" } },
    { id: "e2", source: "prompt-1", target: "image-1", style: { stroke: "#3B82F6" } },
    { id: "e3", source: "prompt-1", target: "video-1", style: { stroke: "#10B981" } },
    { id: "e4", source: "prompt-1", target: "voice-1", style: { stroke: "#F59E0B" } },
    { id: "e5", source: "image-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e6", source: "video-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e7", source: "voice-1", target: "assembly-1", style: { stroke: "#6B7280" } },
    { id: "e8", source: "assembly-1", target: "batch-1", style: { stroke: "#8B5CF6" } },
    { id: "e9", source: "batch-1", target: "preview-1", style: { stroke: "#14B8A6" } },
  ],
};

/* ═══════════════════════════════════════════════════
 * EXPORT ALL TEMPLATES
 * ═══════════════════════════════════════════════════ */
export const workflowTemplates: WorkflowTemplate[] = [
  // Original 7
  fullPipeline,
  talkingHead,
  sceneVideo,
  dualCharacter,
  danceVideo,
  fluxMultiRef,
  batchFactory,
  // New 25 from catalog
  ugcTalkingHeadTestimonial,
  productSceneTransformation,
  cinematicFirstLastFrame,
  multiPlatformCampaign,
  productPhotoAdPoster,
  brandingProductShot,
  productHeroShot,
  adPosterGenerator,
  facelessExplainer,
  product3DFromImage,
  ugcWalkAndTalk,
  eyeCatchingProductAd,
  cinematicAdCampaign,
  talkingAvatarPresenter,
  modularMarketing,
  multimodalAdPipeline,
  ugcEcommerceBatch,
  autoCommercial,
  aiAdCreatorVLM,
  logoBrandAnimator,
  dayInTheLife,
  unboxingVideo,
  productAutoAnimator,
  multiShotPhotography,
  shortFormPOV,
];

export function getTemplate(id: string): WorkflowTemplate | undefined {
  return workflowTemplates.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return workflowTemplates.filter((t) => t.category === category);
}
