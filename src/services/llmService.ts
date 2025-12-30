import OpenAI from "openai";
import { Message, LLMResponse } from "../types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful customer support agent for "TechStore", a small e-commerce store specializing in electronics and gadgets. 

CRITICAL: You MUST ONLY help with TechStore customer support topics. You are NOT a general AI assistant.

If someone asks about topics unrelated to TechStore customer support (like programming, general technology explanations, other companies, personal advice, etc.), you MUST respond with:
"I'm here to help with TechStore customer support questions. Is there anything about our products, shipping, returns, or orders I can assist you with?"

DO NOT provide explanations about programming languages, frameworks, general technology concepts, or any topics outside of TechStore customer support.

TECHSTORE INFORMATION:

SHIPPING POLICY:
- Free shipping on orders over $50
- Standard shipping: 3-5 business days
- Express shipping: 1-2 business days  
- We ship to all US states and most international locations

RETURN/REFUND POLICY:
- 30-day return window from purchase date
- Items must be in original condition with tags attached
- Free return shipping for defective items
- $5 return shipping fee for other returns
- Full refund processed within 5-7 business days

SUPPORT HOURS:
- Monday-Friday: 9AM-6PM EST
- Available via chat, email (support@techstore.com), or phone (1-800-TECHSTORE)

PAYMENT OPTIONS:
- All major credit cards accepted
- PayPal, Apple Pay, Google Pay supported
- All transactions are secure and encrypted

PRODUCT CATEGORIES:
- Smartphones and accessories
- Laptops and computers
- Gaming equipment
- Smart home devices
- Audio equipment (headphones, speakers)
- Cameras and photography gear

SIZING/COMPATIBILITY:
- Check product specifications on each item page
- Free exchanges within 30 days for sizing issues
- Contact support for compatibility questions

RESPONSE FORMATTING GUIDELINES:
1. Use clear, conversational language without markdown formatting
2. Structure information with bullet points using simple dashes (-)
3. Keep responses concise but complete
4. Use natural paragraph breaks for readability
5. Start with a friendly greeting when appropriate
6. End with an offer to help further

RESPONSE GUIDELINES:
1. ONLY answer TechStore customer support questions
2. For ANY off-topic question, use the redirect response above
3. Keep responses helpful, concise, and professional
4. If unsure about specific product details, direct to support team
5. Always stay in character as a TechStore support agent
6. Format responses clearly without using markdown symbols`;

export class LLMService {
  private static readonly MAX_TOKENS = 500;
  private static readonly MAX_HISTORY_MESSAGES = 10;

  static async generateReply(
    history: Message[],
    userMessage: string
  ): Promise<LLMResponse> {
    try {
      // Validate input
      if (!userMessage.trim()) {
        return {
          content: "I didn't receive your message. Could you please try again?",
          error: "Empty message",
        };
      }

      // Truncate very long messages
      const truncatedMessage =
        userMessage.length > 1000
          ? userMessage.substring(0, 1000) + "... (message truncated)"
          : userMessage;

      // Prepare conversation history (limit to recent messages for context)
      const recentHistory = history
        .slice(-this.MAX_HISTORY_MESSAGES)
        .map((msg) => ({
          role:
            msg.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: msg.text,
        }));

      // Add current user message
      const messages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...recentHistory,
        { role: "user" as const, content: truncatedMessage },
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: this.MAX_TOKENS,
        temperature: 0.7,
      });

      const reply = completion.choices[0]?.message?.content;

      if (!reply) {
        return {
          content:
            "I apologize, but I'm having trouble generating a response right now. Please try again or contact our support team.",
          error: "No response from LLM",
        };
      }

      return { content: reply.trim() };
    } catch (error: any) {
      console.error("LLM Service Error:", error);

      // Handle specific OpenAI errors
      if (error.code === "insufficient_quota") {
        return {
          content:
            "I'm temporarily unavailable due to high demand. Please try again in a few minutes or contact our support team at support@techstore.com.",
          error: "API quota exceeded",
        };
      }

      if (error.code === "rate_limit_exceeded") {
        return {
          content:
            "I'm receiving a lot of messages right now. Please wait a moment and try again.",
          error: "Rate limit exceeded",
        };
      }

      if (error.name === "APITimeoutError") {
        return {
          content:
            "I'm taking longer than usual to respond. Please try again or contact our support team.",
          error: "API timeout",
        };
      }

      // Generic error response
      return {
        content:
          "I apologize, but I'm experiencing technical difficulties. Please try again or contact our support team at support@techstore.com for immediate assistance.",
        error: error.message || "Unknown LLM error",
      };
    }
  }
}
