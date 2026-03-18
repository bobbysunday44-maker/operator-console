/* ── Visual Editor Workflow Templates ──
 * Pre-built workflow templates adapted from ComfyUI official templates.
 * Each template is a ReactFlow-ready {nodes, edges} structure.
 */

import type { Node, Edge } from "reactflow";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: "talking_head" | "scene_video" | "image_gen" | "full_pipeline" | "dual_character" | "dance";
  nodes: Node[];
  edges: Edge[];
}

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

/* ── Export all templates ── */
export const workflowTemplates: WorkflowTemplate[] = [
  fullPipeline,
  talkingHead,
  sceneVideo,
  dualCharacter,
  danceVideo,
  fluxMultiRef,
  batchFactory,
];

export function getTemplate(id: string): WorkflowTemplate | undefined {
  return workflowTemplates.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return workflowTemplates.filter((t) => t.category === category);
}
