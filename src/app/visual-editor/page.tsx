"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  MiniMap,
  Panel,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "@/components/visual-editor/nodes";
import { OcBadge } from "@/components/shared";
import { workflowTemplates, type WorkflowTemplate } from "@/lib/visual-editor/templates";
import {
  Save, Play, Plus, Trash2, Layers,
  Image as ImageIcon, Video, Mic, Scissors, Sparkles,
  User, FileText, Eye, Wand2,
} from "lucide-react";

/* ── Default workflow: Content Pipeline ── */
const defaultNodes: Node[] = [
  { id: "content-1", type: "content", position: { x: 0, y: 180 }, data: { title: "New Content", description: "Enter topic or select from Ideas", niche: "AI", platforms: ["TikTok", "Instagram", "YouTube"] } },
  { id: "char-1", type: "character", position: { x: 0, y: 0 }, data: { name: "Select Character", niche: "AI", traits: ["confident", "witty"] } },
  { id: "prompt-1", type: "prompt", position: { x: 300, y: 120 }, data: { prompt: "", status: "idle" } },
  { id: "image-1", type: "imageGen", position: { x: 600, y: 0 }, data: { model: "Nano Banana 2", status: "idle" } },
  { id: "video-1", type: "videoGen", position: { x: 600, y: 220 }, data: { model: "Veo 3.1", duration: "8s", resolution: "1080p", aspect: "9:16", status: "idle" } },
  { id: "voice-1", type: "voice", position: { x: 600, y: 420 }, data: { engine: "Qwen3-TTS 1.7B", speaker: "serena", status: "idle" } },
  { id: "lipsync-1", type: "lipSync", position: { x: 900, y: 100 }, data: { model: "Kling 3.0", status: "idle" } },
  { id: "assembly-1", type: "assembly", position: { x: 1200, y: 200 }, data: { status: "idle" } },
  { id: "preview-1", type: "preview", position: { x: 1200, y: 0 }, data: { type: "video" } },
];

const defaultEdges: Edge[] = [
  { id: "e-content-prompt", source: "content-1", target: "prompt-1", animated: true, style: { stroke: "#8B5CF6" } },
  { id: "e-char-prompt", source: "char-1", target: "prompt-1", animated: true, style: { stroke: "#F43F5E" } },
  { id: "e-prompt-image", source: "prompt-1", target: "image-1", style: { stroke: "#3B82F6" } },
  { id: "e-prompt-video", source: "prompt-1", target: "video-1", style: { stroke: "#10B981" } },
  { id: "e-prompt-voice", source: "prompt-1", target: "voice-1", style: { stroke: "#F59E0B" } },
  { id: "e-image-lipsync", source: "image-1", target: "lipsync-1", style: { stroke: "#EC4899" } },
  { id: "e-voice-lipsync", source: "voice-1", target: "lipsync-1", style: { stroke: "#EC4899" } },
  { id: "e-video-assembly", source: "video-1", target: "assembly-1", style: { stroke: "#6B7280" } },
  { id: "e-lipsync-assembly", source: "lipsync-1", target: "assembly-1", style: { stroke: "#6B7280" } },
  { id: "e-lipsync-preview", source: "lipsync-1", target: "preview-1", style: { stroke: "#14B8A6", strokeDasharray: "5,5" } },
];

/* ── Node palette for drag-and-drop ── */
const nodePalette = [
  { type: "content", label: "Content Input", icon: FileText, color: "text-indigo-600" },
  { type: "character", label: "Character", icon: User, color: "text-rose-600" },
  { type: "prompt", label: "Script Writer", icon: Wand2, color: "text-violet-600" },
  { type: "imageGen", label: "Image Gen", icon: ImageIcon, color: "text-blue-600" },
  { type: "videoGen", label: "Video Gen", icon: Video, color: "text-emerald-600" },
  { type: "voice", label: "Voice", icon: Mic, color: "text-amber-600" },
  { type: "lipSync", label: "Lip Sync", icon: Sparkles, color: "text-pink-600" },
  { type: "assembly", label: "Assembly", icon: Scissors, color: "text-gray-700" },
  { type: "preview", label: "Preview", icon: Eye, color: "text-teal-600" },
  { type: "batch", label: "Batch", icon: Layers, color: "text-purple-600" },
];

/* ── Workflow list types ── */
interface WorkflowMeta { id: string; name: string; niche: string | null; isDefault: boolean; updatedAt: string; }

function VisualEditorCanvas() {
  const [nodes, setNodes] = useState<Node[]>(defaultNodes);
  const [edges, setEdges] = useState<Edge[]>(defaultEdges);
  const [workflows, setWorkflows] = useState<WorkflowMeta[]>([]);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState("Default Pipeline");
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPalette, setShowPalette] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const nodeIdCounter = useRef(10);

  // Load saved workflows
  useEffect(() => {
    fetch("/api/workflows").then((r) => r.json())
      .then((data) => setWorkflows(data.workflows || []))
      .catch(() => {});
  }, []);

  // Load a template into the canvas
  const loadTemplate = useCallback((tmpl: WorkflowTemplate) => {
    setNodes(tmpl.nodes);
    setEdges(tmpl.edges);
    setWorkflowName(tmpl.name);
    setCurrentWorkflowId(null);
    setSelectedNode(null);
  }, []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []
  );
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: "#94A3B8" } }, eds)), []
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Add node from palette
  const addNode = useCallback((type: string) => {
    const id = `${type}-${nodeIdCounter.current++}`;
    const defaults: Record<string, Record<string, unknown>> = {
      content: { title: "New Content", niche: "AI", platforms: ["TikTok", "Instagram"] },
      character: { name: "New Character", niche: "AI", traits: [] },
      prompt: { prompt: "", status: "idle" },
      imageGen: { model: "Nano Banana 2", status: "idle" },
      videoGen: { model: "Veo 3.1", duration: "8s", resolution: "1080p", aspect: "9:16", status: "idle" },
      voice: { engine: "Qwen3-TTS 1.7B", speaker: "serena", status: "idle" },
      lipSync: { model: "Kling 3.0", status: "idle" },
      assembly: { status: "idle" },
      preview: { type: "video" },
      batch: { count: 5, mode: "sequential", status: "idle" },
    };

    const newNode: Node = {
      id,
      type,
      position: { x: 400 + Math.random() * 200, y: 200 + Math.random() * 200 },
      data: defaults[type] || {},
    };
    setNodes((nds) => [...nds, newNode]);
  }, []);

  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  }, [selectedNode]);

  // Save workflow
  const saveWorkflow = useCallback(async () => {
    setSaving(true);
    const method = currentWorkflowId ? "PATCH" : "POST";
    const url = currentWorkflowId ? `/api/workflows/${currentWorkflowId}` : "/api/workflows";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: workflowName, nodes, edges }),
    });
    const data = await res.json();
    if (data.workflow?.id) setCurrentWorkflowId(data.workflow.id);

    // Refresh list
    const listRes = await fetch("/api/workflows").then((r) => r.json()).catch(() => ({ workflows: [] }));
    setWorkflows(listRes.workflows || []);
    setSaving(false);
  }, [currentWorkflowId, workflowName, nodes, edges]);

  // Load workflow
  const loadWorkflow = useCallback(async (id: string) => {
    const res = await fetch(`/api/workflows/${id}`).then((r) => r.json()).catch(() => null);
    if (res?.workflow) {
      setNodes(res.workflow.nodes as Node[]);
      setEdges(res.workflow.edges as Edge[]);
      setWorkflowName(res.workflow.name);
      setCurrentWorkflowId(res.workflow.id);
    }
  }, []);

  // Run workflow
  const runWorkflow = useCallback(async () => {
    let workflowId = currentWorkflowId;

    if (!workflowId) {
      // Save first and get the ID back
      const saveRes = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workflowName, nodes, edges }),
      });
      const saveData = await saveRes.json();
      workflowId = saveData.workflow?.id;
      if (workflowId) setCurrentWorkflowId(workflowId);
    }

    if (!workflowId) {
      alert("Failed to save workflow before running");
      return;
    }

    setRunning(true);

    // Mark all nodes as running
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: "running" } })));

    try {
      const res = await fetch(`/api/workflows/${workflowId}/run`, { method: "POST" });
      const data = await res.json();

      // Update node statuses based on run result
      if (data.run?.nodeOutputs) {
        const outputs = data.run.nodeOutputs as Record<string, { status: string; preview?: string; cost?: number }>;
        setNodes((nds) => nds.map((n) => {
          const output = outputs[n.id];
          if (output) {
            return { ...n, data: { ...n.data, status: output.status === "completed" ? "done" : "error", preview: output.preview, cost: output.cost } };
          }
          return { ...n, data: { ...n.data, status: "done" } };
        }));
      }
    } catch {
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: "error" } })));
    }

    setRunning(false);
  }, [currentWorkflowId, saveWorkflow]);

  // Memoize node types
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* Left Sidebar — Node Palette + Workflows */}
      {showPalette && (
        <div className="w-[220px] bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto">
          {/* Node Palette */}
          <div className="p-3 border-b border-gray-100">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Add Nodes</div>
            <div className="flex flex-col gap-1">
              {nodePalette.map((item) => (
                <button
                  key={item.type}
                  onClick={() => addNode(item.type)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 text-left"
                >
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span className="text-xs text-gray-700">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Template Picker */}
          <div className="p-3 border-b border-gray-100">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Templates</div>
            <div className="flex flex-col gap-1">
              {workflowTemplates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => loadTemplate(tmpl)}
                  className="text-left px-2 py-1.5 rounded hover:bg-blue-50 group"
                >
                  <div className="text-xs text-gray-700 font-medium group-hover:text-blue-700">{tmpl.name}</div>
                  <div className="text-[9px] text-gray-400 line-clamp-1">{tmpl.description.slice(0, 60)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Saved Workflows */}
          <div className="p-3">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Workflows</div>
            <div className="flex flex-col gap-1">
              {workflows.length === 0 && <div className="text-[10px] text-gray-400">No saved workflows</div>}
              {workflows.map((w) => (
                <button
                  key={w.id}
                  onClick={() => loadWorkflow(w.id)}
                  className={`text-left px-2 py-1.5 rounded text-xs ${currentWorkflowId === w.id ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {w.name}
                  {w.isDefault && <span className="ml-1 text-[9px] text-gray-400">(default)</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={memoizedNodeTypes}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          defaultEdgeOptions={{ animated: false, style: { strokeWidth: 2 } }}
        >
          <Background gap={20} size={1} color="#f0f0f0" />
          <Controls position="bottom-right" />
          <MiniMap
            nodeStrokeWidth={3}
            pannable
            zoomable
            style={{ width: 150, height: 100, border: "1px solid #e5e7eb", borderRadius: 8 }}
          />

          {/* Top toolbar */}
          <Panel position="top-left">
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-sm font-semibold text-gray-800 bg-transparent border-none outline-none w-48"
              />
              <OcBadge label={running ? "Running..." : "Ready"} color={running ? "#3B82F6" : "#059669"} bg={running ? "#EFF6FF" : "#ECFDF5"} />
            </div>
          </Panel>

          <Panel position="top-right">
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm">
              <button onClick={() => setShowPalette(!showPalette)} className="p-1.5 rounded hover:bg-gray-100" title="Toggle palette">
                <Plus className="w-4 h-4 text-gray-500" />
              </button>
              <button onClick={saveWorkflow} disabled={saving} className="p-1.5 rounded hover:bg-gray-100" title="Save workflow">
                <Save className={`w-4 h-4 ${saving ? "text-blue-500 animate-pulse" : "text-gray-500"}`} />
              </button>
              <button onClick={deleteSelectedNode} disabled={!selectedNode} className="p-1.5 rounded hover:bg-gray-100" title="Delete selected">
                <Trash2 className={`w-4 h-4 ${selectedNode ? "text-red-500" : "text-gray-300"}`} />
              </button>
              <div className="w-px h-5 bg-gray-200" />
              <button
                onClick={runWorkflow}
                disabled={running}
                className="flex items-center gap-1.5 px-3 py-1 bg-green-600 text-white rounded-md text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                {running ? "Running..." : "Run"}
              </button>
            </div>
          </Panel>

          {/* Selected node detail panel */}
          {selectedNode && (
            <Panel position="bottom-left">
              <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-sm min-w-[250px] max-w-[320px]">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Node: {selectedNode.type}</div>
                <div className="text-xs text-gray-700 space-y-1">
                  {Object.entries(selectedNode.data || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-500">{key}:</span>
                      <span className="font-mono text-gray-800 truncate ml-2 max-w-[180px]">
                        {typeof value === "object" ? JSON.stringify(value).slice(0, 30) : String(value).slice(0, 30)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}

export default function VisualEditorPage() {
  return (
    <ReactFlowProvider>
      <VisualEditorCanvas />
    </ReactFlowProvider>
  );
}
