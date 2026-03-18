"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  Wand2, Image as ImageIcon, Video, Mic, Scissors,
  User, FileText, Eye, Sparkles, Layers,
} from "lucide-react";

/* ── Base Node Shell ── */
function NodeShell({
  label, icon: Icon, color, borderColor, children, handles, status,
}: {
  label: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  children?: React.ReactNode;
  handles?: { inputs?: number; outputs?: number };
  status?: "idle" | "running" | "done" | "error";
}) {
  const statusColors = {
    idle: "bg-gray-400",
    running: "bg-blue-500 animate-pulse",
    done: "bg-green-500",
    error: "bg-red-500",
  };

  return (
    <div className={`min-w-[200px] max-w-[280px] rounded-lg border-2 ${borderColor} bg-white shadow-md`}>
      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-md ${color}`}>
        <Icon className="w-4 h-4 text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">{label}</span>
        {status && <div className={`w-2 h-2 rounded-full ml-auto ${statusColors[status]}`} />}
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 text-xs">
        {children}
      </div>

      {/* Handles */}
      {(handles?.inputs ?? 1) > 0 && <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white" />}
      {(handles?.outputs ?? 1) > 0 && <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white" />}
    </div>
  );
}

/* ── Prompt Node ── */
export const PromptNode = memo(({ data }: NodeProps) => (
  <NodeShell label="Script Writer" icon={Wand2} color="bg-violet-600" borderColor="border-violet-300" status={data.status}>
    <div className="text-gray-600 mb-1.5">Claude Sonnet 4.6</div>
    {data.prompt && (
      <div className="p-1.5 bg-violet-50 rounded text-[10px] text-violet-800 line-clamp-3">{data.prompt}</div>
    )}
    {data.output && (
      <div className="mt-1.5 p-1.5 bg-green-50 rounded text-[10px] text-green-700 line-clamp-2">
        <span className="font-semibold">Output:</span> {data.output}
      </div>
    )}
    {data.cost != null && <div className="mt-1 text-[9px] text-gray-400 font-mono">Cost: ${data.cost.toFixed(4)}</div>}
  </NodeShell>
));
PromptNode.displayName = "PromptNode";

/* ── Image Generation Node ── */
export const ImageGenNode = memo(({ data }: NodeProps) => (
  <NodeShell label="Image Gen" icon={ImageIcon} color="bg-blue-600" borderColor="border-blue-300" status={data.status}>
    <div className="text-gray-600 mb-1.5">{data.model || "Nano Banana 2"}</div>
    {data.loraId && <div className="text-[10px] text-blue-600 font-mono mb-1">LoRA: {data.loraId}</div>}
    {data.preview && (
      <div className="mt-1.5 w-full aspect-square bg-gray-100 rounded overflow-hidden">
        <img src={data.preview} alt="Generated" className="w-full h-full object-cover" />
      </div>
    )}
    {!data.preview && <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-[10px]">No preview</div>}
    {data.cost != null && <div className="mt-1 text-[9px] text-gray-400 font-mono">Cost: ${data.cost.toFixed(4)}</div>}
  </NodeShell>
));
ImageGenNode.displayName = "ImageGenNode";

/* ── Video Generation Node ── */
export const VideoGenNode = memo(({ data }: NodeProps) => (
  <NodeShell label="Video Gen" icon={Video} color="bg-emerald-600" borderColor="border-emerald-300" status={data.status}>
    <div className="text-gray-600 mb-1.5">{data.model || "Veo 3.1"}</div>
    <div className="text-[10px] text-gray-500">
      {data.duration || "8s"} · {data.resolution || "1080p"} · {data.aspect || "9:16"}
    </div>
    {data.preview && (
      <div className="mt-1.5 w-full aspect-video bg-black rounded overflow-hidden">
        <video src={data.preview} className="w-full h-full object-cover" muted autoPlay loop />
      </div>
    )}
    {!data.preview && <div className="w-full h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-[10px]">No preview</div>}
    {data.cost != null && <div className="mt-1 text-[9px] text-gray-400 font-mono">Cost: ${data.cost.toFixed(4)}</div>}
  </NodeShell>
));
VideoGenNode.displayName = "VideoGenNode";

/* ── Lip Sync Node ── */
export const LipSyncNode = memo(({ data }: NodeProps) => (
  <NodeShell label="Lip Sync" icon={Sparkles} color="bg-pink-600" borderColor="border-pink-300" status={data.status}>
    <div className="text-gray-600 mb-1.5">{data.model || "Kling 3.0"}</div>
    <div className="text-[10px] text-gray-500">Image + Audio → Talking Head</div>
    {data.preview && (
      <div className="mt-1.5 w-full aspect-video bg-black rounded overflow-hidden">
        <video src={data.preview} className="w-full h-full object-cover" muted autoPlay loop />
      </div>
    )}
    {data.cost != null && <div className="mt-1 text-[9px] text-gray-400 font-mono">Cost: ${data.cost.toFixed(4)}</div>}
  </NodeShell>
));
LipSyncNode.displayName = "LipSyncNode";

/* ── Voice Node ── */
export const VoiceNode = memo(({ data }: NodeProps) => (
  <NodeShell label="Voice" icon={Mic} color="bg-amber-600" borderColor="border-amber-300" status={data.status}>
    <div className="text-gray-600 mb-1.5">{data.engine || "Qwen3-TTS 1.7B"}</div>
    {data.profileId && <div className="text-[10px] text-amber-600 font-mono mb-1">Profile: {data.profileId}</div>}
    {data.speaker && <div className="text-[10px] text-gray-500">Speaker: {data.speaker}</div>}
    {data.audioUrl && (
      <audio controls className="w-full h-7 mt-1.5" src={data.audioUrl}>
        <track kind="captions" />
      </audio>
    )}
    <div className="mt-1 text-[9px] text-gray-400 font-mono">Cost: Free (local)</div>
  </NodeShell>
));
VoiceNode.displayName = "VoiceNode";

/* ── Assembly Node ── */
export const AssemblyNode = memo(({ data }: NodeProps) => (
  <NodeShell label="Assembly" icon={Scissors} color="bg-gray-700" borderColor="border-gray-400" status={data.status} handles={{ inputs: 1, outputs: 0 }}>
    <div className="text-gray-600 mb-1.5">FFmpeg</div>
    <div className="text-[10px] text-gray-500">Video + Audio → Final MP4</div>
    {data.outputPath && (
      <div className="mt-1.5 p-1.5 bg-green-50 rounded text-[10px] text-green-700 font-mono truncate">
        {data.outputPath}
      </div>
    )}
    <div className="mt-1 text-[9px] text-gray-400 font-mono">Cost: Free</div>
  </NodeShell>
));
AssemblyNode.displayName = "AssemblyNode";

/* ── Character Node ── */
export const CharacterNode = memo(({ data }: NodeProps) => (
  <NodeShell label="Character" icon={User} color="bg-rose-600" borderColor="border-rose-300" status={data.status} handles={{ inputs: 0, outputs: 1 }}>
    <div className="font-semibold text-gray-800 mb-1">{data.name || "No character"}</div>
    {data.niche && <div className="text-[10px] text-gray-500 mb-1">Niche: {data.niche}</div>}
    {data.traits && <div className="text-[10px] text-rose-600">{data.traits.slice(0, 3).join(", ")}</div>}
    {data.voiceProfile && <div className="text-[10px] text-amber-600 mt-1">Voice: {data.voiceProfile}</div>}
    {data.referenceImage && (
      <div className="mt-1.5 w-16 h-16 bg-gray-100 rounded overflow-hidden">
        <img src={data.referenceImage} alt={data.name} className="w-full h-full object-cover" />
      </div>
    )}
  </NodeShell>
));
CharacterNode.displayName = "CharacterNode";

/* ── Input/Content Node ── */
export const ContentNode = memo(({ data }: NodeProps) => (
  <NodeShell label="Content Input" icon={FileText} color="bg-indigo-600" borderColor="border-indigo-300" handles={{ inputs: 0, outputs: 1 }}>
    <div className="font-semibold text-gray-800 mb-1 truncate">{data.title || "Untitled"}</div>
    {data.description && <div className="text-[10px] text-gray-500 line-clamp-2">{data.description}</div>}
    {data.niche && <div className="text-[10px] text-indigo-600 mt-1">Niche: {data.niche}</div>}
    {data.platforms && <div className="text-[10px] text-gray-400 mt-0.5">{data.platforms.join(", ")}</div>}
  </NodeShell>
));
ContentNode.displayName = "ContentNode";

/* ── Preview/Output Node ── */
export const PreviewNode = memo(({ data }: NodeProps) => (
  <NodeShell label="Preview" icon={Eye} color="bg-teal-600" borderColor="border-teal-300" handles={{ inputs: 1, outputs: 0 }}>
    {data.type === "image" && data.url && (
      <img src={data.url} alt="Preview" className="w-full rounded" />
    )}
    {data.type === "video" && data.url && (
      <video src={data.url} className="w-full rounded" controls muted>
        <track kind="captions" />
      </video>
    )}
    {data.type === "audio" && data.url && (
      <audio controls className="w-full h-7" src={data.url}>
        <track kind="captions" />
      </audio>
    )}
    {!data.url && (
      <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-[10px]">
        Run workflow to see output
      </div>
    )}
    {data.totalCost != null && (
      <div className="mt-1.5 text-[10px] font-mono text-gray-500">Total: ${data.totalCost.toFixed(4)}</div>
    )}
  </NodeShell>
));
PreviewNode.displayName = "PreviewNode";

/* ── Batch Node ── */
export const BatchNode = memo(({ data }: NodeProps) => (
  <NodeShell label="Batch" icon={Layers} color="bg-purple-600" borderColor="border-purple-300" status={data.status}>
    <div className="text-gray-600 mb-1">Batch Generator</div>
    <div className="text-[10px] text-gray-500">Count: {data.count || 1}</div>
    <div className="text-[10px] text-gray-500">Mode: {data.mode || "sequential"}</div>
  </NodeShell>
));
BatchNode.displayName = "BatchNode";

/* ── Export node types map ── */
export const nodeTypes = {
  prompt: PromptNode,
  imageGen: ImageGenNode,
  videoGen: VideoGenNode,
  lipSync: LipSyncNode,
  voice: VoiceNode,
  assembly: AssemblyNode,
  character: CharacterNode,
  content: ContentNode,
  preview: PreviewNode,
  batch: BatchNode,
};
