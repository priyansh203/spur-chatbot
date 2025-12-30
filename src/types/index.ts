export interface Message {
  id: string;
  conversationId: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  error?: string;
}

export interface LLMResponse {
  content: string;
  error?: string;
}
