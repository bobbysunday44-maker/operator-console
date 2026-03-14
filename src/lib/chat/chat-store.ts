/* ── OpenClaw Chat Store ──
 * In-memory conversation store.
 * Will be replaced by Prisma + PostgreSQL once DB is connected.
 */

import type { Conversation, ChatMessage } from "./types";

class ChatStore {
  private conversations = new Map<string, Conversation>();
  private counter = 0;

  private nextId(prefix: string): string {
    this.counter++;
    return `${prefix}-${Date.now()}-${this.counter}`;
  }

  createConversation(title: string, source: "dashboard" | "telegram" = "dashboard"): Conversation {
    const conv: Conversation = {
      id: this.nextId("conv"),
      title,
      source,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.conversations.set(conv.id, conv);
    return conv;
  }

  getConversation(id: string): Conversation | null {
    return this.conversations.get(id) || null;
  }

  listConversations(): Conversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  addMessage(conversationId: string, message: Omit<ChatMessage, "id" | "conversationId" | "timestamp">): ChatMessage {
    const conv = this.conversations.get(conversationId);
    if (!conv) throw new Error(`Conversation ${conversationId} not found`);

    const msg: ChatMessage = {
      ...message,
      id: this.nextId("msg"),
      conversationId,
      timestamp: Date.now(),
    };

    conv.messages.push(msg);
    conv.updatedAt = Date.now();

    // Auto-title from first user message
    if (conv.messages.length === 1 && msg.role === "user") {
      conv.title = msg.content.slice(0, 60) + (msg.content.length > 60 ? "..." : "");
    }

    return msg;
  }

  getMessages(conversationId: string): ChatMessage[] {
    const conv = this.conversations.get(conversationId);
    return conv ? conv.messages : [];
  }

  deleteConversation(id: string): boolean {
    return this.conversations.delete(id);
  }
}

/* ── Singleton ── */
const globalForChat = globalThis as unknown as { chatStore: ChatStore };
export const chatStore = globalForChat.chatStore || new ChatStore();
if (process.env.NODE_ENV !== "production") {
  globalForChat.chatStore = chatStore;
}

/* ── Seed demo conversations ── */
function seedIfEmpty() {
  if (chatStore.listConversations().length > 0) return;

  const c1 = chatStore.createConversation("TikTok AI agents post");
  chatStore.addMessage(c1.id, {
    role: "user",
    content: "Create a TikTok about AI agents automating social media",
  });
  chatStore.addMessage(c1.id, {
    role: "assistant",
    content: "I'll create that for you! Starting the Creation Studio pipeline:\n\n1. **Prompt Writer** — Generating hook and script with Gen-Z tone\n2. **Image Gen** — Robot hand scrolling phone with neon glow\n3. **Video Gen** — Cinematic zoom with glitch effects\n4. **Voiceover** — en-US-GuyNeural narrator\n5. **Assembly** — 9:16 vertical MP4\n\nPipeline started as CNT-0047. You can track progress in the Studio.",
    model: "claude-sonnet-4-6",
    tokens: { input: 42, output: 127 },
    command: {
      type: "create_content",
      raw: "Create a TikTok about AI agents automating social media",
      params: { platform: "TikTok", topic: "AI agents automating social media" },
      dispatched: true,
    },
  });
  chatStore.addMessage(c1.id, {
    role: "user",
    content: "What's the status?",
  });
  chatStore.addMessage(c1.id, {
    role: "assistant",
    content: "CNT-0047 status:\n- ✅ Prompt Writer — 2.1s, $0.003\n- ✅ Image Gen — 4.8s, $0.002\n- 🔄 Video Gen — 67% (Veo 3.1)\n- ⏳ Voiceover — queued\n- ⏳ Assembly — queued\n\nEstimated completion: ~30 seconds.",
    model: "claude-sonnet-4-6",
    tokens: { input: 38, output: 89 },
  });

  const c2 = chatStore.createConversation("Agent fleet check");
  chatStore.addMessage(c2.id, {
    role: "user",
    content: "How are my agents doing?",
  });
  chatStore.addMessage(c2.id, {
    role: "assistant",
    content: "Agent Fleet Status:\n\n| Agent | Status | Tasks Today |\n|-------|--------|-------------|\n| Ideator | 🟢 Online | 12 |\n| Writer | 🟡 Busy | 8 |\n| Designer | 🟢 Online | 15 |\n| Filmmaker | 🟡 Busy | 3 |\n| Editor | 🟢 Online | 7 |\n| Social Bot | 🟢 Online | 24 |\n| Engage Bot | 🟢 Online | 31 |\n| Scanner | 🟢 Online | 48 |\n\n6 online, 2 busy, 0 errors. Total cost today: $1.24",
    model: "claude-sonnet-4-6",
    tokens: { input: 28, output: 156 },
    command: {
      type: "list_agents",
      raw: "How are my agents doing?",
      params: {},
      dispatched: true,
    },
  });

  const c3 = chatStore.createConversation("Scheduling help");
  chatStore.addMessage(c3.id, {
    role: "user",
    content: "Schedule a post about trending tech for tomorrow at 3pm on all platforms",
  });
  chatStore.addMessage(c3.id, {
    role: "assistant",
    content: "I've queued up a content creation pipeline:\n\n**Topic:** Trending tech\n**Schedule:** Tomorrow at 3:00 PM\n**Platforms:** TikTok, Instagram, Twitter/X\n\nThe pipeline will run automatically 45 minutes before the scheduled time to ensure the content is ready. I'll notify you in Telegram when it's done for your approval.",
    model: "claude-sonnet-4-6",
    tokens: { input: 35, output: 98 },
  });
}

seedIfEmpty();
