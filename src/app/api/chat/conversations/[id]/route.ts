/* GET /api/chat/conversations/[id] — Get conversation with messages
 * DELETE /api/chat/conversations/[id] — Delete a conversation
 */

import { NextResponse } from "next/server";
import { chatStore } from "@/lib/chat/chat-store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const conversation = chatStore.getConversation(params.id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  return NextResponse.json({ conversation });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const deleted = chatStore.deleteConversation(params.id);
  if (!deleted) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
