/* ── OpenClaw Chat Types (matches Prisma API responses) ── */

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokensIn: number | null;
  tokensOut: number | null;
  cost: number | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  model: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}
