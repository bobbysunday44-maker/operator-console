"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Wand2,
  Share2,
  MessageSquare,
  Bot,
  ListTodo,
  Calendar,
  Archive,
  Globe,
  GitBranch,
  BarChart3,
  Settings,
  Lightbulb,
  FlaskConical,
  Brain,
  Target,
  DollarSign,
  Zap,
  Layers,
  Workflow,
} from "lucide-react";

const navItems = [
  { key: "/", label: "Overview", icon: LayoutDashboard },
  { key: "/ideas", label: "Ideas & Research", icon: Lightbulb },
  { key: "/studio", label: "Creation Studio", icon: Wand2 },
  { key: "/visual-editor", label: "Visual Editor", icon: Workflow },
  { key: "/social", label: "Social Media", icon: Share2 },
  { key: "/strategy", label: "Content Strategy", icon: Target },
  { key: "/chat", label: "Chat & Commands", icon: MessageSquare },
  { key: "/agents", label: "Agent Fleet", icon: Bot },
  { key: "/ab-testing", label: "A/B Testing", icon: FlaskConical },
  { key: "/brand", label: "Brand & Memory", icon: Brain },
  { key: "/monetization", label: "Monetization", icon: DollarSign },
  { key: "/autonomous", label: "Autonomous Mode", icon: Zap },
  { key: "/batch", label: "Mass Operations", icon: Layers },
  { key: "/tasks", label: "Tasks", icon: ListTodo },
  { key: "/schedules", label: "Schedules", icon: Calendar },
  { key: "/archive", label: "Archive", icon: Archive },
  { key: "/browser", label: "Browser Sessions", icon: Globe },
  { key: "/routing", label: "Model Routing", icon: GitBranch },
  { key: "/analytics", label: "Analytics", icon: BarChart3 },
  { key: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-sidebar bg-oc-card border-r border-oc-border flex flex-col shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-[18px] pt-6 pb-7">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-oc-sm bg-oc-text flex items-center justify-center text-white text-[13px] font-bold">
            OC
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-[-0.02em] text-oc-text">
              OpenClaw
            </div>
            <div className="text-[9px] text-oc-text-muted font-medium tracking-[0.02em]">
              OPERATOR CONSOLE
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.key;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.key}
              className={`flex items-center gap-[9px] w-full px-[18px] py-[9px] text-[13px] transition-all duration-hover border-r-2 ${
                isActive
                  ? "bg-oc-bg text-oc-text font-semibold border-oc-blue"
                  : "text-oc-text-secondary font-normal border-transparent hover:bg-oc-bg/50"
              }`}
            >
              <Icon
                size={14}
                className={`shrink-0 ${isActive ? "opacity-70" : "opacity-50"}`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Chrome Sessions Status */}
      <div className="px-[18px] py-3 border-t border-oc-border">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Globe size={12} className="text-oc-text-muted" />
          <span className="text-[11px] font-semibold text-oc-text">
            Chrome Sessions
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-[7px] h-[7px] rounded-full bg-oc-green status-glow-green" />
          <span className="text-[11px] text-oc-green font-medium">
            0 tabs active
          </span>
        </div>
        <div className="text-tiny text-oc-text-muted mt-[3px] font-mono">
          Claude Code v2.0
        </div>
      </div>

      {/* User */}
      <div className="px-[18px] py-3 border-t border-oc-border">
        <div className="flex items-center gap-2">
          <div className="w-[26px] h-[26px] rounded-full bg-oc-blue-light flex items-center justify-center text-tiny font-bold text-oc-blue">
            BC
          </div>
          <div>
            <div className="text-small font-semibold text-oc-text">Bobby C.</div>
            <div className="text-[9px] text-oc-text-muted">Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
