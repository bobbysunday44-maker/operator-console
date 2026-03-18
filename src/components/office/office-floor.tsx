"use client";

import { AgentSprite, AgentSpriteData } from "./agent-sprite";
import { MeetingTable } from "./meeting-table";

// ── Layout constants ──
const FLOOR_WIDTH = 700;
const FLOOR_HEIGHT = 600;

// Desk positions (9 desks in a 3x3-ish layout, Opus at top center)
const DESK_POSITIONS: { label: string; x: number; y: number }[] = [
  { label: "opus",      x: 350, y: 70 },    // top center (boss)
  { label: "ideator",   x: 120, y: 160 },
  { label: "writer",    x: 350, y: 160 },
  { label: "designer",  x: 580, y: 160 },
  { label: "filmmaker", x: 120, y: 320 },
  { label: "editor",    x: 580, y: 320 },
  { label: "social",    x: 120, y: 470 },
  { label: "engage",    x: 350, y: 470 },
  { label: "scanner",   x: 580, y: 470 },
];

// Where special positions map to
const MEETING_POS = { x: 350, y: 320 };
const LOUNGE_POS = { x: 600, y: 540 };

// Map agent type to desk index
function getAgentDeskPosition(agentType: string): { x: number; y: number } {
  const desk = DESK_POSITIONS.find((d) => d.label === agentType);
  return desk ? { x: desk.x, y: desk.y } : { x: 350, y: 320 };
}

// Get position based on agent state
export function resolveAgentPosition(
  agentType: string,
  position: string
): { x: number; y: number } {
  switch (position) {
    case "meeting_table":
      // Spread agents around the meeting table
      return {
        x: MEETING_POS.x + (Math.random() * 60 - 30),
        y: MEETING_POS.y + (Math.random() * 40 - 20),
      };
    case "lounge":
      return {
        x: LOUNGE_POS.x + (Math.random() * 30 - 15),
        y: LOUNGE_POS.y + (Math.random() * 20 - 10),
      };
    case "walking":
      return {
        x: 100 + Math.random() * 500,
        y: 100 + Math.random() * 400,
      };
    case "desk":
    default:
      return getAgentDeskPosition(agentType);
  }
}

interface OfficeFloorProps {
  agents: AgentSpriteData[];
  onAgentClick: (agent: AgentSpriteData) => void;
  recentMessages: Record<string, string>;
}

export function OfficeFloor({
  agents,
  onAgentClick,
  recentMessages,
}: OfficeFloorProps) {
  const agentsAtTable = agents.filter((a) => a.position === "meeting_table");

  return (
    <div className="flex-1 flex items-center justify-center overflow-hidden bg-[#F5F3EE]">
      {/* Perspective wrapper */}
      <div
        style={{
          perspective: "1200px",
          perspectiveOrigin: "50% 40%",
        }}
      >
        {/* Isometric container */}
        <div
          style={{
            width: FLOOR_WIDTH,
            height: FLOOR_HEIGHT,
            position: "relative",
            transform: "rotateX(55deg) rotateZ(-45deg)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Floor base */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "repeating-conic-gradient(#EDE9E0 0% 25%, #E8E4DB 0% 50%) 0 0 / 50px 50px",
              borderRadius: 8,
              border: "2px solid #D8D4CB",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.12), 12px 12px 0 #C8C4BB",
            }}
          />

          {/* Rug under meeting table */}
          <div
            style={{
              position: "absolute",
              left: MEETING_POS.x - 85,
              top: MEETING_POS.y - 60,
              width: 170,
              height: 120,
              background: "linear-gradient(135deg, #DCD0F0 0%, #E8DDF8 100%)",
              borderRadius: 60,
              opacity: 0.5,
              zIndex: 1,
            }}
          />

          {/* Lounge area rug */}
          <div
            style={{
              position: "absolute",
              left: LOUNGE_POS.x - 60,
              top: LOUNGE_POS.y - 40,
              width: 120,
              height: 80,
              background: "linear-gradient(135deg, #C5E8D5 0%, #D5F0E0 100%)",
              borderRadius: 40,
              opacity: 0.4,
              zIndex: 1,
            }}
          />

          {/* Desks */}
          {DESK_POSITIONS.map((desk, i) => (
            <Desk
              key={desk.label}
              x={desk.x}
              y={desk.y}
              isBoss={i === 0}
              label={desk.label}
              occupant={agents.find((a) => a.type === desk.label && a.position === "desk")}
            />
          ))}

          {/* Meeting table */}
          <MeetingTable
            agentsAtTable={agentsAtTable}
            x={MEETING_POS.x}
            y={MEETING_POS.y}
          />

          {/* Lounge furniture */}
          <LoungeArea x={LOUNGE_POS.x} y={LOUNGE_POS.y} />

          {/* Plant decorations */}
          <Plant x={50} y={50} />
          <Plant x={650} y={80} />
          <Plant x={50} y={540} />

          {/* Water cooler */}
          <div
            className="absolute"
            style={{
              left: 50,
              top: 320,
              width: 20,
              height: 30,
              background: "linear-gradient(180deg, #93C5FD 0%, #60A5FA 100%)",
              borderRadius: 4,
              border: "2px solid #3B82F6",
              boxShadow: "3px 3px 0 #2563EB40",
              zIndex: 2,
            }}
          />

          {/* Agent sprites */}
          {agents.map((agent) => (
            <AgentSprite
              key={agent.id}
              agent={agent}
              onClick={onAgentClick}
              recentMessage={recentMessages[agent.name] || null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function Desk({
  x,
  y,
  isBoss,
  label,
  occupant,
}: {
  x: number;
  y: number;
  isBoss: boolean;
  label: string;
  occupant?: AgentSpriteData;
}) {
  const deskW = isBoss ? 100 : 80;
  const deskH = isBoss ? 50 : 40;

  return (
    <div
      className="absolute"
      style={{
        left: x - deskW / 2,
        top: y - deskH / 2 + 25,
        zIndex: 2,
      }}
    >
      {/* Desk surface */}
      <div
        style={{
          width: deskW,
          height: deskH,
          background: isBoss
            ? "linear-gradient(135deg, #4A3728 0%, #3A2A1E 100%)"
            : "linear-gradient(135deg, #A8956E 0%, #8B7B5A 100%)",
          borderRadius: 6,
          border: isBoss ? "2px solid #2A1A0E" : "2px solid #7A6B4A",
          boxShadow: isBoss
            ? "5px 5px 0 #1A0A00, 0 3px 8px rgba(0,0,0,0.2)"
            : "4px 4px 0 #6A5B3A",
          position: "relative",
        }}
      >
        {/* Monitor */}
        <div
          style={{
            position: "absolute",
            left: isBoss ? 35 : 25,
            top: 6,
            width: isBoss ? 30 : 24,
            height: isBoss ? 20 : 16,
            background: occupant
              ? "linear-gradient(135deg, #1E293B 0%, #334155 100%)"
              : "#374151",
            borderRadius: 2,
            border: "1px solid #1E293B",
          }}
        >
          {/* Screen glow when active */}
          {occupant && occupant.activity === "working" && (
            <div
              style={{
                position: "absolute",
                inset: 2,
                background: "linear-gradient(135deg, #93C5FD40 0%, #60A5FA30 100%)",
                borderRadius: 1,
                animation: "screen-flicker 3s ease-in-out infinite",
              }}
            />
          )}
        </div>

        {/* Nameplate */}
        <div
          className="absolute left-1/2 pointer-events-none"
          style={{
            bottom: -16,
            transform: "translateX(-50%) rotateZ(45deg) rotateX(-55deg)",
          }}
        >
          <span className="text-[7px] font-medium text-[#A09080] capitalize whitespace-nowrap">
            {label}
          </span>
        </div>
      </div>

      {/* Chair */}
      <div
        style={{
          position: "absolute",
          left: deskW / 2 - 10,
          top: deskH + 4,
          width: 20,
          height: 14,
          background: isBoss
            ? "linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%)"
            : "#6B7280",
          borderRadius: "0 0 6px 6px",
          border: "1px solid #4B5563",
        }}
      />
    </div>
  );
}

function LoungeArea({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute"
      style={{ left: x - 50, top: y - 25, zIndex: 2 }}
    >
      {/* Couch */}
      <div
        style={{
          width: 70,
          height: 35,
          background: "linear-gradient(135deg, #7C9A6B 0%, #6B8A5A 100%)",
          borderRadius: "12px 12px 6px 6px",
          border: "2px solid #5A7A4A",
          boxShadow: "4px 4px 0 #4A6A3A",
        }}
      />
      {/* Bean bag */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 5,
          width: 28,
          height: 28,
          background: "linear-gradient(135deg, #F0A060 0%, #E09050 100%)",
          borderRadius: "50%",
          border: "2px solid #D08040",
          boxShadow: "3px 3px 0 #C07030",
        }}
      />
      {/* Coffee table */}
      <div
        style={{
          position: "absolute",
          left: 20,
          top: 42,
          width: 30,
          height: 18,
          background: "#8B7355",
          borderRadius: 4,
          border: "1px solid #6B5B45",
          boxShadow: "2px 2px 0 #5A4A35",
        }}
      />
      {/* Label */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: 15,
          top: -14,
          transform: "rotateZ(45deg) rotateX(-55deg)",
        }}
      >
        <span className="text-[7px] font-medium text-[#8A9A7A] whitespace-nowrap">
          Lounge
        </span>
      </div>
    </div>
  );
}

function Plant({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute" style={{ left: x, top: y, zIndex: 2 }}>
      {/* Pot */}
      <div
        style={{
          width: 16,
          height: 12,
          background: "#C4705A",
          borderRadius: "0 0 4px 4px",
          border: "1px solid #A45A44",
        }}
      />
      {/* Leaves */}
      <div
        style={{
          position: "absolute",
          left: -2,
          top: -10,
          width: 20,
          height: 14,
          background: "radial-gradient(circle, #4ADE80 40%, #22C55E 100%)",
          borderRadius: "50%",
          opacity: 0.9,
        }}
      />
    </div>
  );
}
