"use client";

import { AgentSpriteData } from "./agent-sprite";

interface MeetingTableProps {
  agentsAtTable: AgentSpriteData[];
  x: number;
  y: number;
}

export function MeetingTable({ agentsAtTable, x, y }: MeetingTableProps) {
  const hasMeeting = agentsAtTable.length > 0;

  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        zIndex: 2,
      }}
    >
      {/* Table surface */}
      <div
        style={{
          width: 120,
          height: 80,
          background: "linear-gradient(135deg, #A0785A 0%, #8B6544 100%)",
          borderRadius: 12,
          border: "3px solid #7A5A3E",
          boxShadow: "6px 6px 0 #5A4A35, 0 4px 12px rgba(0,0,0,0.15)",
          position: "relative",
        }}
      >
        {/* Table shine */}
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 8,
            right: 20,
            height: 4,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 2,
          }}
        />

        {/* Meeting status label */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: "translate(-50%, -50%) rotateZ(45deg) rotateX(-55deg)",
            zIndex: 20,
          }}
        >
          {hasMeeting ? (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full"
              style={{
                background: "rgba(124, 58, 237, 0.9)",
                boxShadow: "0 0 12px rgba(124, 58, 237, 0.4)",
                animation: "meeting-glow 2s ease-in-out infinite",
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-white"
                style={{ animation: "blink 1.5s ease-in-out infinite" }}
              />
              <span className="text-[8px] font-bold text-white whitespace-nowrap tracking-wide uppercase">
                Meeting
              </span>
            </div>
          ) : (
            <span className="text-[8px] font-medium text-[#A09080] whitespace-nowrap">
              Conference
            </span>
          )}
        </div>
      </div>

      {/* Chairs around the table */}
      {[
        { cx: -20, cy: 10 },   // left
        { cx: 140, cy: 10 },   // right
        { cx: -20, cy: 60 },   // left bottom
        { cx: 140, cy: 60 },   // right bottom
        { cx: 30, cy: -16 },   // top left
        { cx: 80, cy: -16 },   // top right
        { cx: 30, cy: 94 },    // bottom left
        { cx: 80, cy: 94 },    // bottom right
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: pos.cx,
            top: pos.cy,
            width: 16,
            height: 16,
            borderRadius: 4,
            background: "#6B5B4B",
            border: "1px solid #5A4A3A",
            boxShadow: "2px 2px 0 #4A3A2A",
          }}
        />
      ))}
    </div>
  );
}
