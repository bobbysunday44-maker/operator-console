"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionHeader } from "@/components/shared/section-header";
import { OcCard } from "@/components/shared/oc-card";
import {
  Key,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  AlertCircle,
  Bot,
  Image as ImageIcon,
  Video,
  Mic,
  Send,
  Globe,
  Bell,
  Settings2,
  Lightbulb,
  X,
  Plus,
} from "lucide-react";

/* ── Types ── */
interface ApiKeyField {
  key: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  description: string;
}

interface SettingField {
  key: string;
  label: string;
  type: "text" | "select" | "toggle";
  value: string | boolean;
  options?: { label: string; value: string }[];
  description: string;
}

/* ── API Key Definitions ── */
const apiKeyFields: ApiKeyField[] = [
  {
    key: "ANTHROPIC_API_KEY",
    label: "Anthropic (Claude Sonnet 4.6)",
    icon: <Bot className="w-4 h-4" />,
    placeholder: "sk-ant-api03-...",
    description: "Powers all language tasks — content writing, chat, analysis",
  },
  {
    key: "GEMINI_API_KEY",
    label: "Google Gemini (Nano Banana + Veo 3.1)",
    icon: <ImageIcon className="w-4 h-4" />,
    placeholder: "AIza...",
    description: "Image generation via Nano Banana 2, video via Veo 3.1",
  },
  {
    key: "KLING_API_KEY",
    label: "Kling AI (Lip Sync)",
    icon: <Video className="w-4 h-4" />,
    placeholder: "kling-...",
    description: "AI lip sync for character-driven video content",
  },
  {
    key: "TELEGRAM_BOT_TOKEN",
    label: "Telegram Bot Token",
    icon: <Send className="w-4 h-4" />,
    placeholder: "123456:ABC-DEF...",
    description: "Telegram bot for alerts, approvals, and remote control",
  },
  {
    key: "SOCIAL_API_KEY",
    label: "Social Posting API",
    icon: <Send className="w-4 h-4" />,
    placeholder: "your-api-key",
    description: "Post for Me, Upload-Post, or Ayrshare API key for direct social media posting",
  },
];

/* ── General Settings ── */
const generalSettingsInit: SettingField[] = [
  {
    key: "DEFAULT_TTS_VOICE",
    label: "Default TTS Voice",
    type: "select",
    value: "en-US-JennyNeural",
    options: [
      { label: "Jenny (US Female)", value: "en-US-JennyNeural" },
      { label: "Guy (US Male)", value: "en-US-GuyNeural" },
      { label: "Aria (US Female)", value: "en-US-AriaNeural" },
      { label: "Davis (US Male)", value: "en-US-DavisNeural" },
      { label: "Sonia (UK Female)", value: "en-GB-SoniaNeural" },
    ],
    description: "edge-tts voice for voiceover generation",
  },
  {
    key: "CONTENT_ARCHIVE_PATH",
    label: "Content Archive Path",
    type: "text",
    value: "./content-archive",
    description: "Local directory for storing generated content assets",
  },
  {
    key: "DEFAULT_MODEL",
    label: "Default Language Model",
    type: "select",
    value: "claude-sonnet-4-6",
    options: [
      { label: "Claude Sonnet 4.6", value: "claude-sonnet-4-6" },
    ],
    description: "Primary model for all language tasks (v3.1: Claude only)",
  },
  {
    key: "SOCIAL_API_PROVIDER",
    label: "Social Posting Provider",
    type: "select",
    value: "postforme",
    options: [
      { label: "Post for Me (postforme.dev)", value: "postforme" },
      { label: "Upload-Post (upload-post.com)", value: "uploadpost" },
      { label: "Ayrshare (ayrshare.com)", value: "ayrshare" },
    ],
    description: "Which third-party API service to use for posting to social media",
  },
];

/* ── Notification Settings ── */
const notificationSettingsInit: SettingField[] = [
  {
    key: "NOTIFY_PIPELINE_COMPLETE",
    label: "Pipeline Completion",
    type: "toggle",
    value: true,
    description: "Send Telegram alert when a content pipeline finishes",
  },
  {
    key: "NOTIFY_QUALITY_FAIL",
    label: "Quality Gate Failures",
    type: "toggle",
    value: true,
    description: "Alert when content fails quality check (< 7/10 score)",
  },
  {
    key: "NOTIFY_SCHEDULE_ERRORS",
    label: "Schedule Errors",
    type: "toggle",
    value: true,
    description: "Alert when a scheduled task fails to execute",
  },
  {
    key: "NOTIFY_BUDGET_WARNING",
    label: "Budget Warnings",
    type: "toggle",
    value: false,
    description: "Alert when daily AI spend exceeds threshold",
  },
];

/* ── Masked Input Component ── */
function MaskedApiKeyInput({
  field,
  value,
  onChange,
}: {
  field: ApiKeyField;
  value: string;
  onChange: (val: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  const maskedValue =
    value.length > 4
      ? "•".repeat(value.length - 4) + value.slice(-4)
      : value;

  return (
    <div className="flex items-start gap-3 py-4 border-b border-oc-border-light last:border-b-0">
      <div className="flex items-center justify-center w-8 h-8 rounded-oc-sm bg-oc-blue-light text-oc-blue shrink-0 mt-0.5">
        {field.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <label className="text-small font-semibold text-oc-text">
            {field.label}
          </label>
          {value && (
            <span className="flex items-center gap-1 text-tiny text-oc-green">
              <CheckCircle className="w-3 h-3" />
              Configured
            </span>
          )}
          {!value && (
            <span className="flex items-center gap-1 text-tiny text-oc-amber">
              <AlertCircle className="w-3 h-3" />
              Not set
            </span>
          )}
        </div>
        <p className="text-tiny text-oc-text-muted mb-2">{field.description}</p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type={visible ? "text" : "password"}
              value={visible ? value : value ? maskedValue : ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 text-small font-mono bg-oc-bg border border-oc-border rounded-oc-sm outline-none focus:border-oc-blue focus:ring-1 focus:ring-oc-blue/20 transition-all duration-hover placeholder:text-oc-text-muted/50"
            />
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-oc-text-muted hover:text-oc-text transition-colors"
            >
              {visible ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <span className="text-tiny font-mono text-oc-text-muted shrink-0 w-[120px] text-right">
            {field.key}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Settings Page ── */
export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    ANTHROPIC_API_KEY: "",
    GEMINI_API_KEY: "",
    KLING_API_KEY: "",
    TELEGRAM_BOT_TOKEN: "",
    SOCIAL_API_KEY: "",
  });

  const [generalSettings, setGeneralSettings] =
    useState<SettingField[]>(generalSettingsInit);
  const [notificationSettings, setNotificationSettings] =
    useState<SettingField[]>(notificationSettingsInit);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [trackedNiches, setTrackedNiches] = useState<string[]>(["AI", "tech", "automation"]);
  const [newNiche, setNewNiche] = useState("");

  const [platforms, setPlatforms] = useState<{ id: string; name: string; handle: string; connected: boolean }[]>([]);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [platformHandle, setPlatformHandle] = useState("");

  const fetchPlatforms = useCallback(async () => {
    try {
      const res = await fetch("/api/platforms");
      const data = await res.json();
      if (data.platforms) setPlatforms(data.platforms);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchPlatforms(); }, [fetchPlatforms]);

  async function handlePlatformConnect(id: string) {
    if (!platformHandle.trim()) return;
    await fetch(`/api/platforms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connected: true, handle: platformHandle }),
    });
    setPlatformHandle("");
    setConnectingPlatform(null);
    fetchPlatforms();
  }

  async function handlePlatformDisconnect(id: string) {
    await fetch(`/api/platforms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connected: false }),
    });
    fetchPlatforms();
  }

  // Load settings from API on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          // Load API keys (masked from server)
          const keys: Record<string, string> = {};
          for (const field of apiKeyFields) {
            keys[field.key] = data.settings[field.key] || "";
          }
          setApiKeys(keys);

          // Load general settings
          setGeneralSettings((prev) =>
            prev.map((s) => ({
              ...s,
              value: data.settings[s.key] ?? s.value,
            }))
          );

          // Load notification settings
          setNotificationSettings((prev) =>
            prev.map((s) => ({
              ...s,
              value: data.settings[s.key] === "true" ? true : data.settings[s.key] === "false" ? false : s.value,
            }))
          );

          // Load tracked niches
          if (data.settings.TRACKED_NICHES) {
            try {
              setTrackedNiches(JSON.parse(data.settings.TRACKED_NICHES));
            } catch { /* keep defaults */ }
          }
        }
      })
      .catch((err) => console.error("Failed to load settings:", err));
  }, []);

  const handleApiKeyChange = (key: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [key]: value }));
  };

  const handleGeneralChange = (key: string, value: string | boolean) => {
    setGeneralSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    );
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    );
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      // Merge all settings into one object
      const allSettings: Record<string, string> = { ...apiKeys };
      for (const s of generalSettings) {
        allSettings[s.key] = String(s.value);
      }
      for (const s of notificationSettings) {
        allSettings[s.key] = String(s.value);
      }
      allSettings.TRACKED_NICHES = JSON.stringify(trackedNiches);

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: allSettings }),
      });

      if (!res.ok) throw new Error("Save failed");

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Settings save error:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const configuredCount = Object.values(apiKeys).filter(Boolean).length;

  return (
    <>
      <SectionHeader
        title="Settings"
        subtitle="API keys, model configuration, and notifications"
      />

      {/* ── Save Bar ── */}
      <div className="flex items-center justify-between mb-5 p-3 bg-oc-card border border-oc-border rounded-oc">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-oc-sm bg-oc-blue-light">
            <Key className="w-4 h-4 text-oc-blue" />
          </div>
          <div>
            <div className="text-small font-semibold text-oc-text">
              {configuredCount} of {apiKeyFields.length} API keys configured
            </div>
            <div className="text-tiny text-oc-text-muted">
              All keys are encrypted before storage
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className="flex items-center gap-2 px-4 py-2 text-small font-semibold text-white bg-oc-blue rounded-oc-sm hover:bg-oc-blue/90 transition-colors duration-hover disabled:opacity-60"
        >
          {saveStatus === "saving" ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : saveStatus === "saved" ? (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        {/* ── Left Column ── */}
        <div className="space-y-5">
          {/* API Keys Section */}
          <OcCard>
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-4 h-4 text-oc-blue" />
              <h3 className="text-section-title text-oc-text">API Keys</h3>
            </div>
            <p className="text-tiny text-oc-text-muted mb-3">
              Credentials for AI models and external services. Keys are
              encrypted at rest using Fernet symmetric encryption.
            </p>
            <div>
              {apiKeyFields.map((field) => (
                <MaskedApiKeyInput
                  key={field.key}
                  field={field}
                  value={apiKeys[field.key]}
                  onChange={(val) => handleApiKeyChange(field.key, val)}
                />
              ))}
            </div>
          </OcCard>

          {/* General Settings Section */}
          <OcCard>
            <div className="flex items-center gap-2 mb-1">
              <Settings2 className="w-4 h-4 text-oc-purple" />
              <h3 className="text-section-title text-oc-text">
                General Settings
              </h3>
            </div>
            <p className="text-tiny text-oc-text-muted mb-3">
              Default values for content generation and system behavior.
            </p>
            <div className="space-y-4">
              {generalSettings.map((setting) => (
                <div
                  key={setting.key}
                  className="flex items-start gap-3 py-3 border-b border-oc-border-light last:border-b-0"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-oc-sm bg-oc-purple-light text-oc-purple shrink-0 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <label className="text-small font-semibold text-oc-text block mb-0.5">
                      {setting.label}
                    </label>
                    <p className="text-tiny text-oc-text-muted mb-2">
                      {setting.description}
                    </p>
                    {setting.type === "select" && setting.options ? (
                      <select
                        value={setting.value as string}
                        onChange={(e) =>
                          handleGeneralChange(setting.key, e.target.value)
                        }
                        className="w-full max-w-xs px-3 py-2 text-small bg-oc-bg border border-oc-border rounded-oc-sm outline-none focus:border-oc-blue transition-colors"
                      >
                        {setting.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : setting.type === "text" ? (
                      <input
                        type="text"
                        value={setting.value as string}
                        onChange={(e) =>
                          handleGeneralChange(setting.key, e.target.value)
                        }
                        className="w-full max-w-sm px-3 py-2 text-small font-mono bg-oc-bg border border-oc-border rounded-oc-sm outline-none focus:border-oc-blue transition-colors"
                      />
                    ) : null}
                  </div>
                  <span className="text-tiny font-mono text-oc-text-muted shrink-0 mt-1">
                    {setting.key}
                  </span>
                </div>
              ))}
            </div>
          </OcCard>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-5">
          {/* Notifications Section */}
          <OcCard>
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4 text-oc-amber" />
              <h3 className="text-section-title text-oc-text">Notifications</h3>
            </div>
            <p className="text-tiny text-oc-text-muted mb-3">
              Telegram alerts for pipeline events and system warnings.
            </p>
            <div className="space-y-1">
              {notificationSettings.map((setting) => (
                <div
                  key={setting.key}
                  className="flex items-center justify-between py-3 border-b border-oc-border-light last:border-b-0"
                >
                  <div className="flex-1 mr-3">
                    <div className="text-small font-medium text-oc-text">
                      {setting.label}
                    </div>
                    <div className="text-tiny text-oc-text-muted">
                      {setting.description}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleNotificationChange(
                        setting.key,
                        !(setting.value as boolean)
                      )
                    }
                    className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0 ${
                      setting.value ? "bg-oc-blue" : "bg-oc-border"
                    }`}
                  >
                    <div
                      className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        setting.value ? "left-[22px]" : "left-[3px]"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </OcCard>

          {/* Platform Connections */}
          <OcCard>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-oc-green" />
              <h3 className="text-section-title text-oc-text">Platform Connections</h3>
            </div>
            <p className="text-tiny text-oc-text-muted mb-3">
              Connect social media accounts for API-powered direct posting.
            </p>
            <div className="space-y-1">
              {platforms.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-oc-border-light last:border-b-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${p.connected ? "bg-oc-green" : "bg-oc-text-muted"}`} />
                    <div>
                      <div className="text-small font-medium text-oc-text">{p.name}</div>
                      <div className="text-tiny text-oc-text-muted font-mono">@{p.handle}</div>
                    </div>
                  </div>
                  {connectingPlatform === p.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={platformHandle}
                        onChange={(e) => setPlatformHandle(e.target.value)}
                        placeholder="@handle"
                        className="w-24 px-2 py-1 text-tiny font-mono bg-oc-bg border border-oc-border rounded-[4px] outline-none focus:border-oc-blue"
                        autoFocus
                      />
                      <button
                        onClick={() => handlePlatformConnect(p.id)}
                        className="text-tiny font-semibold text-white bg-oc-green px-2 py-1 rounded-[4px] border-none cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setConnectingPlatform(null); setPlatformHandle(""); }}
                        className="text-tiny text-oc-text-muted cursor-pointer bg-transparent border-none"
                      >
                        ✕
                      </button>
                    </div>
                  ) : p.connected ? (
                    <button
                      onClick={() => handlePlatformDisconnect(p.id)}
                      className="text-tiny font-semibold text-oc-red bg-oc-red-light px-2.5 py-1 rounded-[4px] border-none cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => { setConnectingPlatform(p.id); setPlatformHandle(p.handle); }}
                      className="text-tiny font-semibold text-oc-blue bg-oc-blue-light px-2.5 py-1 rounded-[4px] border-none cursor-pointer"
                    >
                      Connect
                    </button>
                  )}
                </div>
              ))}
              {platforms.length === 0 && (
                <div className="text-center py-4 text-tiny text-oc-text-muted">
                  No platforms configured. Add platforms via the database seed.
                </div>
              )}
            </div>
          </OcCard>

          {/* Content Niches */}
          <OcCard>
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-oc-purple" />
              <h3 className="text-section-title text-oc-text">Content Niches</h3>
            </div>
            <p className="text-tiny text-oc-text-muted mb-3">
              Topics the Scanner agent tracks for trending content.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {trackedNiches.map((niche) => (
                <span key={niche} className="flex items-center gap-1 text-tiny font-semibold px-2.5 py-1 rounded-oc-pill bg-oc-purple-light text-oc-purple">
                  {niche}
                  <button
                    onClick={() => setTrackedNiches((prev) => prev.filter((n) => n !== niche))}
                    className="ml-0.5 text-oc-purple/60 hover:text-oc-red cursor-pointer bg-transparent border-none p-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newNiche}
                onChange={(e) => setNewNiche(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newNiche.trim()) {
                    setTrackedNiches((prev) => [...prev, newNiche.trim()]);
                    setNewNiche("");
                  }
                }}
                placeholder="Add niche..."
                className="flex-1 px-3 py-1.5 text-small bg-oc-bg border border-oc-border rounded-oc-sm outline-none focus:border-oc-blue"
              />
              <button
                onClick={() => {
                  if (newNiche.trim()) {
                    setTrackedNiches((prev) => [...prev, newNiche.trim()]);
                    setNewNiche("");
                  }
                }}
                className="flex items-center justify-center w-8 h-8 bg-oc-purple text-white rounded-oc-sm border-none cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </OcCard>

          {/* Model Status Card */}
          <OcCard>
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-4 h-4 text-oc-teal" />
              <h3 className="text-section-title text-oc-text">
                Model Pipeline (v3.1)
              </h3>
            </div>
            <div className="space-y-2.5">
              {[
                {
                  name: "Claude Sonnet 4.6",
                  role: "All Language",
                  color: "bg-oc-blue",
                  bgColor: "bg-oc-blue-light",
                },
                {
                  name: "Gemini Nano Banana 2",
                  role: "Images",
                  color: "bg-oc-green",
                  bgColor: "bg-oc-green-light",
                },
                {
                  name: "Gemini Veo 3.1",
                  role: "Video",
                  color: "bg-oc-purple",
                  bgColor: "bg-oc-purple-light",
                },
                {
                  name: "Kling Lip Sync",
                  role: "Lip Sync",
                  color: "bg-oc-pink",
                  bgColor: "bg-oc-pink-light",
                },
                {
                  name: "edge-tts",
                  role: "Voice",
                  color: "bg-oc-teal",
                  bgColor: "bg-oc-teal-light",
                },
                {
                  name: "FFmpeg",
                  role: "Assembly",
                  color: "bg-oc-amber",
                  bgColor: "bg-oc-amber-light",
                },
              ].map((model) => (
                <div
                  key={model.name}
                  className="flex items-center justify-between py-2 px-3 rounded-oc-sm bg-oc-bg"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${model.color}`}
                    />
                    <span className="text-small font-medium text-oc-text">
                      {model.name}
                    </span>
                  </div>
                  <span
                    className={`text-tiny font-semibold px-2 py-0.5 rounded-oc-pill ${model.bgColor} text-oc-text-secondary`}
                  >
                    {model.role}
                  </span>
                </div>
              ))}
            </div>
          </OcCard>
        </div>
      </div>
    </>
  );
}
