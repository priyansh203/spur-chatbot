import { Request, Response, NextFunction } from "express";

export const validateChatMessage = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { message } = req.body;

  // Check if message exists and is not empty
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      error: "Valid message is required",
      reply: "Please provide a message to send.",
    });
  }

  // Check message length (prevent extremely long messages)
  if (message.length > 2000) {
    return res.status(400).json({
      error: "Message too long",
      reply: "Please keep your message under 2000 characters.",
    });
  }

  next();
};

export const validateSessionId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.body;

  // SessionId is optional, but if provided, should be a valid UUID format
  if (sessionId && typeof sessionId !== "string") {
    return res.status(400).json({
      error: "Invalid session ID format",
    });
  }

  next();
};
