/* ── OpenClaw Chat Types ── */

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  /** If this message triggered a command */
  command?: ParsedCommand | null;
  tokens?: { input: number; output: number };
  model?: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  /** Where the conversation originated */
  source: "dashboard" | "telegram";
  /** Telegram chat ID if from Telegram */
  telegramChatId?: number;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ParsedCommand {
  type: "create_content" | "check_status" | "list_agents" | "run_pipeline" | "unknown";
  /** Original natural language input */
  raw: string;
  /** Extracted parameters */
  params: Record<string, string>;
  /** Whether the command was successfully dispatched */
  dispatched: boolean;
}

export interface ChatRequest {
  conversationId?: string;
  message: string;
  source?: "dashboard" | "telegram";
}

export interface ChatResponse {
  conversationId: string;
  message: ChatMessage;
  /** If a command was detected and dispatched */
  command?: ParsedCommand | null;
}
