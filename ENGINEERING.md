# Engineering Plan: Dad (SMS Companion)

## Technical Stack

### Core Technologies
- **Frontend/Backend**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: Vercel Postgres
- **ORM**: Prisma
- **SMS Service**: Twilio
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel
- **Scheduling**: Vercel Cron Jobs

## System Architecture

### Components

1. **SMS Gateway (Twilio)**
   - Webhook endpoint for incoming messages
   - Message validation and security
   - Rate limiting
   - Error handling and retries

2. **Message Processing Pipeline**
   - Message validation
   - Context retrieval
   - OpenAI API integration
   - Response formatting
   - Message delivery

3. **Database Layer**
   - Conversation storage
   - User metadata
   - Message history
   - Mood tracking
   - System settings

4. **AI Integration**
   - OpenAI API client
   - Context management
   - Response generation
   - Memory system
   - Personality implementation (System prompt now uses detailed, character-driven prompt from dad.ts for more authentic and consistent responses)

5. **Scheduled Tasks**
   - Daily check-ins
   - Conversation summarization
   - Pattern analysis
   - System maintenance

## Database Schema

```prisma
model User {
  id            String         @id @default(cuid())
  phoneNumber   String         @unique
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  conversations Conversation[]
  metadata      Json?
}

model Conversation {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  messages  Message[]
  summary   String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  tags      String[]
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  content        String
  direction      Direction
  createdAt      DateTime     @default(now())
  metadata       Json?
}

enum Direction {
  INCOMING
  OUTGOING
}
```

## API Routes

### Twilio Webhook
```
POST /api/webhook/twilio
```
- Handles incoming SMS messages
- Validates Twilio signature
- Processes message content
- Triggers AI response generation

### System Management
```
GET /api/health
POST /api/settings
GET /api/conversations
GET /api/conversations/:id
```

## Development Methodology

### Test-Driven Development (TDD)
- Red: Write failing tests first
- Green: Write minimal code to pass tests
- Refactor: Optimize and clean up code
- Repeat

### Iterative Development
Each iteration should:
1. Be independently deployable
2. Include complete test coverage
3. Be production-ready
4. Deliver specific user value

## Development Phases

### Iteration 1: Basic SMS Communication (Week 1)

**Status:** Complete (Green phase, tests passing)

#### What was built
- Project set up with Next.js, TypeScript, and Jest
- Twilio webhook endpoint implemented as an API route
- All business logic extracted to a pure function (`processTwilioWebhook`) for testability
- OpenAI integration stubbed for now
- **Simple web client (simulator UI) added at `/simulator` for local AI response testing, bypassing Twilio.**
- **UI for `/simulator` has been upgraded to a modern, polished, and responsive layout:**
  - Chat and Journal are now displayed in distinct, card-like panels side-by-side on desktop, stacked on mobile.
  - Both panels feature scrollable content areas, improved spacing, and clear visual hierarchy.
  - The design is much more user-friendly and visually appealing, with a clean background and subtle dividers.
  - Further customizations (e.g., avatars, dark mode) are possible.
- Comprehensive test suite covers:
  - Signature validation (missing/invalid)
  - Required parameter validation
  - Calls to OpenAI and Twilio
- All tests pass (green phase)

#### TDD Process
- Followed red-green-refactor cycle ([Codecademy: Red, Green, Refactor](https://www.codecademy.com/article/tdd-red-green-refactor))
- Wrote failing tests first (red)
- Implemented minimal code to pass tests (green)
- Refactored for type safety, maintainability, and clarity (refactor)

#### Notes for Future Agents
- **Testing Next.js API routes:**
  - Directly testing API route files that import from `next/server` can cause issues in Node/Jest due to missing Web APIs (e.g., `Request`).
  - **Best practice:** Extract all business logic to a pure function in a separate file (e.g., `logic.ts`). Test this function directly with Jest.
  - Keep the API route as a thin adapter that passes real dependencies to the pure function.
- **Mocking dependencies:**
  - Use dependency injection for all external services (Twilio, OpenAI, env vars, etc.) in the pure function.
  - In tests, mock these dependencies and set return values as needed.
- **TypeScript:**
  - Add explicit types to all function signatures, mocks, and helpers for maintainability and IDE support.
- **Jest mocking:**
  - Use only one mocking approach per function (either `jest.mock` or `jest.spyOn`, not both).
  - If using `jest.mock`, set return values on the imported mock function in each test.
- **Test structure:**
  - Use helpers for repeated setup (e.g., `createMockRequest`).
  - Add docstrings to clarify intent.

**Deployable Feature**: Basic SMS response system

### Iteration 2: Conversation Storage (Week 1-2)
**Goal**: Add persistent conversation storage
- [x] Database setup with Prisma
  - [x] Write tests for database models
  - [x] Implement schema
  - [x] Add migration tests
- [x] Conversation storage implementation
  - [x] Write tests for storage operations
  - [x] Implement storage layer
  - [x] Add error handling
- [x] Message persistence
  - [x] Write tests for message storage
  - [x] Implement message saving
  - [x] Add retrieval tests

**Progress Note (2024-05-09, updated 2024-05-10):**
- Database is set up with Prisma and Postgres.
- Schema for User, Conversation, and Message is implemented and migrated.
- Jest tests for model creation and relations are written and passing.
- Conversation storage and message persistence are now implemented and tested.
- The web client now persists conversations across sessions.
- The GET endpoint for conversations is implemented and tested.

**Deployable Feature**: Persistent conversation history

### Iteration 3: Memory System (Week 2)
**Goal**: Implement conversation memory and context
- [ ] Memory system development
  - [ ] Write tests for memory operations
  - [ ] Implement context management
  - [ ] Add memory retrieval tests
- [x] Basic personality implementation
  - [x] Implement personality system (Integrated detailed personality and communication style from dad.ts into OpenAI system prompt in generateResponse.ts)
  - [x] Add response validation

**Deployable Feature**: Contextual conversations with memory

### Iteration 4: Advanced Features (Week 3)
**Goal**: Add check-ins and mood tracking
- [ ] Check-in system implementation
  - [ ] Write tests for scheduling
  - [ ] Implement check-in logic
  - [ ] Add delivery tests
- [ ] Mood tracking system
  - [ ] Write tests for mood detection
  - [ ] Implement mood analysis
  - [ ] Add pattern recognition

**Deployable Feature**: Automated check-ins and mood tracking

### Iteration 5: Polish and Optimization (Week 4)
**Goal**: Enhance reliability and performance
- [ ] Security hardening
  - [ ] Write security tests
  - [ ] Implement security measures
  - [ ] Add penetration tests
- [ ] Performance optimization
  - [ ] Write performance tests
  - [ ] Implement optimizations
  - [ ] Add load tests
- [ ] Monitoring setup
  - [ ] Write monitoring tests
  - [ ] Implement monitoring
  - [ ] Add alert tests

**Deployable Feature**: Production-ready system

## Testing Strategy

### Unit Tests (Jest)
- Message processing
- AI integration
- Database operations
- Utility functions

### Integration Tests (Jest + Supertest)
- API endpoints
- Webhook handling
- Database operations
- External service integration

### Manual/Local Testing
- **Simple web client at `/simulator` allows developers to interact with the AI logic directly, without Twilio, for rapid iteration and debugging.**
- **The `/simulator` UI now provides a modern, side-by-side chat and journal experience for easier manual testing and demonstration.**

### End-to-End Tests (Cypress)
- Full message flow
- Check-in system
- Error handling
- Performance testing

### Test Coverage Requirements
- Minimum 80% code coverage
- 100% coverage for critical paths
- All edge cases covered
- Performance benchmarks defined

## CI/CD Pipeline

### Pre-deployment Checks
1. Run all tests
2. Check code coverage
3. Run linting
4. Security scanning
5. Performance benchmarks

### Deployment Process
1. Deploy to staging
2. Run integration tests
3. Verify functionality
4. Deploy to production
5. Monitor for issues

### Rollback Procedure
1. Automated rollback on failure
2. Database state preservation
3. Configuration management
4. Emergency procedures

## Security Considerations

1. **API Security**
   - Twilio signature validation
   - Rate limiting
   - API key management
   - Request validation

2. **Data Security**
   - Data encryption at rest
   - Secure communication
   - Access control
   - Data retention policies

3. **Privacy**
   - No third-party data sharing
   - Data minimization
   - User data control
   - Compliance with privacy regulations

## Monitoring and Maintenance

1. **Health Checks**
   - API endpoint monitoring
   - Database connection status
   - Twilio service status
   - OpenAI API status

2. **Logging**
   - Request/response logging
   - Error tracking
   - Performance metrics
   - Usage statistics

3. **Alerts**
   - Error rate thresholds
   - API quota warnings
   - System health alerts
   - Security incidents

## Cost Considerations

1. **API Costs**
   - Twilio SMS costs
   - OpenAI API usage
   - Database storage
   - Vercel hosting

2. **Optimization Strategies**
   - Message batching
   - Caching
   - Rate limiting
   - Resource scaling

## Deployment Strategy

1. **Environment Setup**
   - Development
   - Staging
   - Production

2. **CI/CD Pipeline**
   - Automated testing
   - Code quality checks
   - Security scanning
   - Automated deployment

3. **Rollback Procedures**
   - Version control
   - Database backups
   - Configuration management
   - Emergency procedures

## Documentation

1. **Technical Documentation**
   - API documentation
   - Database schema
   - System architecture
   - Deployment procedures

2. **User Documentation**
   - System capabilities
   - Usage guidelines
   - Troubleshooting
   - Support procedures

## Future Considerations

1. **Scalability**
   - Multi-user support
   - Performance optimization
   - Resource scaling
   - Load balancing

2. **Feature Expansion**
   - Additional AI capabilities
   - Enhanced memory system
   - Advanced analytics
   - Customization options

3. **Maintenance**
   - Regular updates
   - Security patches
   - Performance monitoring
   - User feedback integration 