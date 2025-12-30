import { Router, Request, Response } from "express";
import { ChatService } from "../services/chatService";
import { ChatRequest } from "../types";

const router = Router();

// POST /chat/message - Send a message and get AI response
router.post("/message", async (req: Request, res: Response) => {
  try {
    const { message, sessionId }: ChatRequest = req.body;

    // Validate request
    if (!message) {
      return res.status(400).json({
        error: "Message is required",
        reply: "Please provide a message to send.",
        sessionId: sessionId || null,
      });
    }

    if (typeof message !== "string") {
      return res.status(400).json({
        error: "Message must be a string",
        reply: "Invalid message format.",
        sessionId: sessionId || null,
      });
    }

    // Process the message
    const response = await ChatService.processMessage({ message, sessionId });

    res.json(response);
  } catch (error: any) {
    console.error("Chat route error:", error);
    res.status(500).json({
      error: "Internal server error",
      reply:
        "I apologize, but I'm experiencing technical difficulties. Please try again.",
      sessionId: req.body.sessionId || null,
    });
  }
});

// GET /chat/history/:sessionId - Get conversation history
router.get("/history/:sessionId", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        error: "Session ID is required",
      });
    }

    const history = await ChatService.getConversationHistory(sessionId);

    res.json({
      sessionId,
      messages: history,
    });
  } catch (error: any) {
    console.error("History route error:", error);
    res.status(500).json({
      error: "Failed to fetch conversation history",
    });
  }
});

// GET /chat/health - Health check endpoint
router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "chat-api",
  });
});

export default router;
