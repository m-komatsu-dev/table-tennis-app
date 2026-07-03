import { apiRequest } from "@/api/client";
import type { ChatMessage, ChatRoom } from "@/types";

export async function fetchChatRooms() {
  return apiRequest<{ chatRooms: ChatRoom[] }>("/api/mobile/chat-rooms");
}

export async function fetchChatRoom(id: string) {
  return apiRequest<{ chatRoom: ChatRoom & { messages: ChatMessage[] } }>(`/api/mobile/chat-rooms/${id}`);
}

export async function sendChatMessage(roomId: string, body: string) {
  return apiRequest<{ message: ChatMessage }>(`/api/mobile/chat-rooms/${roomId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body })
  });
}
