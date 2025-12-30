class ChatApp {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.isLoading = false;

    this.initializeElements();
    this.attachEventListeners();
    this.loadConversationHistory();
    this.updateWelcomeTime();
  }

  initializeElements() {
    this.chatMessages = document.getElementById("chatMessages");
    this.messageInput = document.getElementById("messageInput");
    this.sendButton = document.getElementById("sendButton");
    this.typingIndicator = document.getElementById("typingIndicator");
    this.charCount = document.getElementById("charCount");
  }

  attachEventListeners() {
    // Send button click
    this.sendButton.addEventListener("click", () => this.sendMessage());

    // Enter key press
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Character count update
    this.messageInput.addEventListener("input", () => {
      const length = this.messageInput.value.length;
      this.charCount.textContent = length;

      // Change color when approaching limit
      if (length > 1800) {
        this.charCount.style.color = "#dc3545";
      } else if (length > 1500) {
        this.charCount.style.color = "#ffc107";
      } else {
        this.charCount.style.color = "#6c757d";
      }
    });

    // Auto-resize input (optional enhancement)
    this.messageInput.addEventListener("input", () => {
      this.messageInput.style.height = "auto";
      this.messageInput.style.height =
        Math.min(this.messageInput.scrollHeight, 120) + "px";
    });
  }

  getOrCreateSessionId() {
    let sessionId = localStorage.getItem("chatSessionId");
    if (!sessionId) {
      sessionId = this.generateUUID();
      localStorage.setItem("chatSessionId", sessionId);
    }
    return sessionId;
  }

  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  async loadConversationHistory() {
    try {
      const response = await fetch(`/api/chat/history/${this.sessionId}`);
      if (response.ok) {
        const data = await response.json();

        // Clear existing messages except welcome message
        const welcomeMessage = this.chatMessages.querySelector(".ai-message");
        this.chatMessages.innerHTML = "";
        if (welcomeMessage) {
          this.chatMessages.appendChild(welcomeMessage);
        }

        // Add historical messages
        data.messages.forEach((message) => {
          this.addMessage(
            message.text,
            message.sender,
            new Date(message.timestamp)
          );
        });

        this.scrollToBottom();
      }
    } catch (error) {
      console.error("Failed to load conversation history:", error);
    }
  }

  async sendMessage() {
    const message = this.messageInput.value.trim();

    if (!message || this.isLoading) {
      return;
    }

    // Validate message length
    if (message.length > 2000) {
      this.showError(
        "Message is too long. Please keep it under 2000 characters."
      );
      return;
    }

    // Add user message to UI
    this.addMessage(message, "user");
    this.messageInput.value = "";
    this.charCount.textContent = "0";
    this.charCount.style.color = "#6c757d";

    // Show loading state
    this.setLoadingState(true);
    this.showTypingIndicator();

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          sessionId: this.sessionId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update session ID if it changed
        if (data.sessionId && data.sessionId !== this.sessionId) {
          this.sessionId = data.sessionId;
          localStorage.setItem("chatSessionId", this.sessionId);
        }

        // Add AI response
        this.addMessage(data.reply, "ai");

        // Log any errors (for debugging)
        if (data.error) {
          console.warn("API returned with error:", data.error);
        }
      } else {
        // Handle API errors
        this.addMessage(
          data.reply || "Sorry, I encountered an error. Please try again.",
          "ai",
          null,
          true
        );
      }
    } catch (error) {
      console.error("Network error:", error);
      this.addMessage(
        "I'm having trouble connecting right now. Please check your internet connection and try again.",
        "ai",
        null,
        true
      );
    } finally {
      this.setLoadingState(false);
      this.hideTypingIndicator();
    }
  }

  addMessage(text, sender, timestamp = null, isError = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    if (isError) {
      contentDiv.classList.add("error-message");
    }

    const textP = document.createElement("p");
    // Convert newlines to HTML line breaks
    textP.innerHTML = text.replace(/\n/g, "<br>");
    contentDiv.appendChild(textP);

    const timeDiv = document.createElement("div");
    timeDiv.className = "message-time";
    timeDiv.textContent = this.formatTime(timestamp || new Date());

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);

    this.chatMessages.appendChild(messageDiv);
    this.scrollToBottom();
  }

  showError(message) {
    this.addMessage(message, "ai", null, true);
  }

  setLoadingState(loading) {
    this.isLoading = loading;
    this.sendButton.disabled = loading;
    this.messageInput.disabled = loading;

    if (loading) {
      this.messageInput.placeholder = "Sending message...";
    } else {
      this.messageInput.placeholder = "Type your message here...";
      this.messageInput.focus();
    }
  }

  showTypingIndicator() {
    this.typingIndicator.style.display = "flex";
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.typingIndicator.style.display = "none";
  }

  scrollToBottom() {
    setTimeout(() => {
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }, 100);
  }

  formatTime(date) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  updateWelcomeTime() {
    const welcomeTimeElement = document.getElementById("welcomeTime");
    if (welcomeTimeElement) {
      welcomeTimeElement.textContent = this.formatTime(new Date());
    }
  }
}

// Initialize the chat app when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new ChatApp();
});

// Handle page visibility changes to reconnect if needed
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    // Page became visible again, could implement reconnection logic here
    console.log("Page visible again");
  }
});
