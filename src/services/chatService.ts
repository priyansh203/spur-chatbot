import { v4 as uuidv4 } from "uuid";
import pool from "../config/database";
import sqliteDb from "../config/database-sqlite";
import { Message, Conversation, ChatRequest, ChatResponse } from "../types";
import { LLMService } from "./llmService";

// Use SQLite for local development, PostgreSQL for production
const db = process.env.DATABASE_URL?.includes("sqlite") ? sqliteDb : pool;

export class ChatService {
  static async processMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Validate input
      if (!request.message || !request.message.trim()) {
        return {
          reply: "Please enter a message to continue our conversation.",
          sessionId: request.sessionId || uuidv4(),
          error: "Empty message",
        };
      }

      // Get or create conversation
      let conversationId: string = request.sessionId || uuidv4();

      if (!request.sessionId) {
        // Create new conversation
        const result = await pool.query(
          "INSERT INTO conversations DEFAULT VALUES RETURNING id"
        );
        conversationId = result.rows[0].id;
      } else {
        // Verify conversation exists
        const existingConv = await pool.query(
          "SELECT id FROM conversations WHERE id = $1",
          [conversationId]
        );

        if (existingConv.rows.length === 0) {
          // Create new conversation with provided ID
          await pool.query("INSERT INTO conversations (id) VALUES ($1)", [
            conversationId,
          ]);
        }
      }

      // Get conversation history
      const historyResult = await pool.query(
        `SELECT id, conversation_id, sender, text, timestamp 
         FROM messages 
         WHERE conversation_id = $1 
         ORDER BY timestamp ASC`,
        [conversationId]
      );

      const history: Message[] = historyResult.rows.map((row) => ({
        id: row.id,
        conversationId: row.conversation_id,
        sender: row.sender,
        text: row.text,
        timestamp: row.timestamp,
      }));

      // Save user message
      await pool.query(
        "INSERT INTO messages (conversation_id, sender, text) VALUES ($1, $2, $3)",
        [conversationId, "user", request.message.trim()]
      );

      // Generate AI response
      const llmResponse = await LLMService.generateReply(
        history,
        request.message
      );

      if (llmResponse.error) {
        console.error("LLM Error:", llmResponse.error);
      }

      // Save AI response
      await pool.query(
        "INSERT INTO messages (conversation_id, sender, text) VALUES ($1, $2, $3)",
        [conversationId, "ai", llmResponse.content]
      );

      // Update conversation timestamp
      await pool.query(
        "UPDATE conversations SET updated_at = NOW() WHERE id = $1",
        [conversationId]
      );

      return {
        reply: llmResponse.content,
        sessionId: conversationId,
        error: llmResponse.error,
      };
    } catch (error: any) {
      console.error("Chat Service Error:", error);

      return {
        reply:
          "I apologize, but I'm experiencing technical difficulties. Please try again or contact our support team at support@techstore.com.",
        sessionId: request.sessionId || uuidv4(),
        error: error.message || "Unknown chat service error",
      };
    }
  }

  static async getConversationHistory(
    conversationId: string
  ): Promise<Message[]> {
    try {
      const result = await pool.query(
        `SELECT id, conversation_id, sender, text, timestamp 
         FROM messages 
         WHERE conversation_id = $1 
         ORDER BY timestamp ASC`,
        [conversationId]
      );

      return result.rows.map((row) => ({
        id: row.id,
        conversationId: row.conversation_id,
        sender: row.sender,
        text: row.text,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      console.error("Error fetching conversation history:", error);
      return [];
    }
  }
}
