# AI Live Chat Agent

A customer support chat application powered by OpenAI's GPT-4o-mini, built with TypeScript, Express.js, and PostgreSQL.

## 🚀 Features

- **Real-time Chat Interface**: Clean, responsive chat UI with typing indicators
- **AI-Powered Responses**: Integration with OpenAI GPT-4o-mini for intelligent customer support
- **Conversation Persistence**: All messages stored in PostgreSQL with session management
- **Error Handling**: Robust error handling for API failures, network issues, and edge cases
- **Rate Limiting**: Built-in protection against spam and abuse
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices
- **Docker Ready**: Containerized for easy deployment

## 🏗️ Architecture

### Backend Structure

```
src/
├── config/          # Database configuration
├── database/        # Schema, migrations, and seeding
├── middleware/      # Validation and security middleware
├── routes/          # API route handlers
├── services/        # Business logic (Chat, LLM services)
├── types/           # TypeScript type definitions
└── server.ts        # Express server setup
```

### Key Components

- **ChatService**: Handles message processing, conversation management, and database operations
- **LLMService**: Manages OpenAI API integration with error handling and response generation
- **Database Layer**: PostgreSQL with proper indexing for conversations and messages
- **Frontend**: Vanilla JavaScript SPA with modern chat UI

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 12+
- OpenAI API Key

## 🛠️ Local Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd ai-chat-agent
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb ai_chat_db
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ai_chat_db

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 4. Database Migration and Seeding

Run migrations to create tables:

```bash
npm run migrate
```

Seed with sample data (optional):

```bash
npm run seed
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🐳 Docker Deployment

### Build and Run with Docker

```bash
# Build the image
docker build -t ai-chat-agent .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL="your_database_url" \
  -e OPENAI_API_KEY="your_openai_key" \
  -e NODE_ENV="production" \
  ai-chat-agent
```

### Docker Compose (with PostgreSQL)

Create `docker-compose.yml`:

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/ai_chat_db
      - OPENAI_API_KEY=your_openai_key_here
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=ai_chat_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with:

```bash
docker-compose up -d
```

## 🚀 Deployment on Render

### 1. Database Setup

- Create a PostgreSQL database on Render
- Note the connection string

### 2. Web Service Setup

- Connect your GitHub repository
- Set build command: `npm install && npm run build`
- Set start command: `npm start`

### 3. Environment Variables

Set these in Render dashboard:

```
DATABASE_URL=<your_render_postgres_url>
OPENAI_API_KEY=<your_openai_key>
NODE_ENV=production
```

### 4. Deploy

- Render will automatically deploy on git push
- Run migrations after first deploy via Render shell:

```bash
npm run migrate
```

## 🔧 API Endpoints

### POST `/api/chat/message`

Send a message and receive AI response.

**Request:**

```json
{
  "message": "What's your return policy?",
  "sessionId": "optional-session-id"
}
```

**Response:**

```json
{
  "reply": "We accept returns within 30 days...",
  "sessionId": "uuid-session-id"
}
```

### GET `/api/chat/history/:sessionId`

Retrieve conversation history.

**Response:**

```json
{
  "sessionId": "uuid",
  "messages": [
    {
      "id": "uuid",
      "sender": "user",
      "text": "Hello",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### GET `/api/health`

Health check endpoint.

## 🤖 LLM Integration

### Provider: OpenAI GPT-4o-mini

**Configuration:**

- Model: `gpt-4o-mini`
- Max tokens: 500
- Temperature: 0.7

**Prompting Strategy:**

- System prompt defines the agent as a TechStore support representative
- Includes comprehensive FAQ knowledge about shipping, returns, support hours, etc.
- Maintains conversation context with recent message history
- Handles edge cases like empty messages, API failures, and rate limits

**Error Handling:**

- API quota exceeded → User-friendly message with alternative contact
- Rate limiting → Polite delay request
- Timeouts → Graceful degradation with support contact info
- Invalid responses → Fallback error message

## 🛡️ Security & Robustness

### Input Validation

- Message length limits (2000 characters)
- Empty message rejection
- SQL injection prevention via parameterized queries
- XSS protection with proper content escaping

### Rate Limiting

- 100 requests per 15 minutes per IP
- Prevents spam and abuse

### Error Handling

- Graceful API failure handling
- Database connection error recovery
- User-friendly error messages
- No sensitive information exposure

### Security Headers

- Helmet.js for security headers
- CORS configuration
- Content Security Policy

## 📊 Database Schema

### Conversations Table

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Messages Table

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    sender VARCHAR(10) CHECK (sender IN ('user', 'ai')),
    text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎯 Design Decisions

### Technology Choices

- **TypeScript**: Type safety and better developer experience
- **Express.js**: Lightweight, flexible web framework
- **PostgreSQL**: Reliable ACID compliance for conversation data
- **Vanilla JS Frontend**: Keeps bundle size minimal, no framework overhead
- **OpenAI GPT-4o-mini**: Good balance of capability and cost

### Architecture Patterns

- **Service Layer**: Separation of business logic from routes
- **Repository Pattern**: Database operations abstracted into services
- **Error Boundaries**: Comprehensive error handling at each layer
- **Stateless Design**: Each request is independent, enabling horizontal scaling

### UX Considerations

- **Auto-scroll**: Messages automatically scroll into view
- **Typing Indicators**: Visual feedback during AI response generation
- **Character Limits**: Prevents extremely long messages
- **Session Persistence**: Conversations survive page refreshes
- **Mobile Responsive**: Works well on all device sizes

---

## 🏗️ Backend Architecture Deep Dive

### Layer Structure

```
┌─────────────────────────────────────┐
│           Frontend (SPA)            │
├─────────────────────────────────────┤
│         API Routes Layer            │
│  - Input validation                 │
│  - Request/response handling        │
├─────────────────────────────────────┤
│        Service Layer               │
│  - ChatService (business logic)    │
│  - LLMService (AI integration)     │
├─────────────────────────────────────┤
│        Data Access Layer           │
│  - PostgreSQL connection pool      │
│  - Query abstraction               │
└─────────────────────────────────────┘
```

### Key Design Decisions

**1. Service Layer Pattern**

- Separates business logic from HTTP concerns
- Makes testing easier and code more maintainable
- Enables reuse across different interfaces

**2. Stateless Architecture**

- Each request is independent
- Enables horizontal scaling
- Session state stored in database, not memory

**3. Error Boundaries**

- Multiple layers of error handling
- Graceful degradation at each level
- User-friendly error messages

**4. Database Design**

- Simple, normalized schema
- UUID primary keys for better distribution
- Proper indexing for query performance

## 🤖 LLM Implementation Details

### Prompt Engineering Strategy

**System Prompt Design:**

- Clear role definition (TechStore support agent)
- Explicit boundaries (only customer support topics)
- Comprehensive knowledge base embedded
- Specific redirect responses for off-topic queries

**Context Management:**

- Maintains last 10 messages for conversation context
- Truncates very long messages (>1000 chars) to manage costs
- Balances context richness with API cost efficiency

**Guardrails Implementation:**

- Prompt-based guardrails (no keyword filtering)
- Strong directive language ("MUST", "CRITICAL")
- Consistent redirect responses for off-topic questions
- Professional tone enforcement

### Trade-offs Made

**GPT-4o-mini vs GPT-4:**

- ✅ **Chosen**: GPT-4o-mini for cost efficiency and speed
- ❌ **Alternative**: GPT-4 for potentially better reasoning
- **Reasoning**: For customer support, speed and cost matter more than advanced reasoning

**Vanilla JS vs React/Vue:**

- ✅ **Chosen**: Vanilla JS for simplicity and minimal bundle size
- ❌ **Alternative**: React/Vue for component reusability
- **Reasoning**: Simple chat interface doesn't justify framework overhead

**PostgreSQL vs MongoDB:**

- ✅ **Chosen**: PostgreSQL for ACID compliance and structured data
- ❌ **Alternative**: MongoDB for flexible schema
- **Reasoning**: Conversation data benefits from relational structure and transactions

**Session Storage in DB vs Redis:**

- ✅ **Chosen**: PostgreSQL for session persistence
- ❌ **Alternative**: Redis for faster access
- **Reasoning**: Simpler architecture, conversations need persistence anyway

## ⚡ Performance Optimizations

- Database indexes on frequently queried columns
- Connection pooling for database efficiency
- Rate limiting to prevent abuse
- Message history truncation for LLM context management
- Gzip compression for API responses

## 🐛 Known Limitations

- No authentication system (by design for this demo)
- Single LLM provider (could add fallbacks)
- No conversation archiving (all conversations persist indefinitely)
- Limited conversation context (last 10 messages)
- No real-time collaboration features

---

