# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AVA Coach Santé IA is a health coaching application with integrated AI for personalized wellness tracking. The project consists of a React frontend and Express.js backend with MongoDB database.

## Architecture

### Frontend (React + Vite)
- **Main App**: Located in `frontend/src/App.jsx` - handles routing and authentication state
- **Component Structure**: Organized by feature (dashboard, health, meal, workout, etc.) in `frontend/src/components/`
- **API Layer**: Centralized API calls in `frontend/src/utils/api.js` and feature-specific APIs in `frontend/src/api/`
- **Context**: Subscription state management in `frontend/src/contexts/SubscriptionContext.jsx`
- **Styling**: Tailwind CSS with custom components

### Backend (Express.js + MongoDB)
- **Server Entry**: `server.js` - main Express server with CORS, authentication middleware
- **API Structure**: RESTful routes organized by domain in `src/api/` (user, health, meal, subscription, etc.)
- **Models**: MongoDB schemas in `src/models/` using Mongoose
- **Services**: Business logic in `src/services/` (e.g., `foodClassifier.js` for TensorFlow.js food recognition)
- **Middleware**: Authentication and validation in `src/middlewares/`

### Key Features
- **AI Integration**: TensorFlow.js for food recognition via camera
- **Subscription Tiers**: Explore (free), Perform, Pro, Elite with feature gating
- **Health Tracking**: Sleep, stress, hydration, energy monitoring
- **Meal Analysis**: Photo-based food recognition with Spoonacular API integration
- **Workout Planning**: Personalized exercise programs
- **AI Chat**: Personalized health advice via chat interface

## Development Commands

### Starting the Application
```bash
# Start full application (both frontend and backend)
./start-app.sh

# Stop application
./stop-app.sh

# Individual components
cd backend && npm run dev    # Backend development server
cd frontend && npm run dev   # Frontend development server
```

### Frontend Commands
```bash
cd frontend
npm run dev      # Development server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
```

### Backend Commands
```bash
cd backend
npm run dev      # Development with nodemon
npm start        # Production start
npm test         # Run Jest tests
```

## Environment Configuration

### Backend (.env in backend/)
- `PORT=5003` - Backend server port
- `MONGODB_URI=mongodb://localhost:27017/coach_sante_db` - Database connection
- `SPOONACULAR_API_KEY` - Required for nutrition data
- `NODE_ENV=development` - Environment mode

### MongoDB Setup
The application expects MongoDB running locally. The start script automatically manages MongoDB via Homebrew.

## Demo Accounts
- Thomas (Pro): thomas@coach.com / motdepasse123
- Sarah (Elite): sarah@coach.com / motdepasse123

## API Endpoints Structure
- `/api/user` - User management and authentication
- `/api/health` - Health metrics tracking
- `/api/meal` - Food analysis and nutrition
- `/api/workout` - Exercise planning
- `/api/subscription` - Premium features and billing
- `/api/ia` - AI chat and recommendations
- `/api/state` - Application state management

## Development Notes
- Frontend uses React Router for navigation with protected routes
- Authentication uses JWT tokens stored in localStorage
- Image uploads are handled via base64 encoding (50mb limit)
- TensorFlow.js models are loaded client-side for food recognition
- Subscription features are gated throughout the application
- The codebase includes multiple component versions (V2 variants are usually the active ones)

## 🚨 CRITICAL TODO LIST - Production Readiness

### Phase 1 - Core Security & Functionality (HIGH PRIORITY)
- [✅ COMPLETED] **SECURITY-001**: Move hardcoded secrets from `backend/src/api/garmin/garmin.controller.js` lines 7-8 to environment variables
- [✅ COMPLETED] **SECURITY-002**: Implement proper JWT secret generation and rotation
- [✅ COMPLETED] **SECURITY-003**: Add input validation middleware for all API endpoints
- [✅ COMPLETED] **SECURITY-004**: Implement XSS protection and SQL injection prevention (included in SECURITY-003)
- [✅ COMPLETED] **PAYMENT-001**: Integrate Stripe/PayPal for real subscription payments in `backend/src/api/subscription/`
- [✅ COMPLETED] **PAYMENT-002**: Implement webhook handling for payment events (included in PAYMENT-001)
- [✅ COMPLETED] **PAYMENT-003**: Add trial period logic and payment failure handling (included in PAYMENT-001)
- [✅ COMPLETED] **SPOON-001**: Complete real Spoonacular API integration in `backend/src/services/spoonacular.service.js`
- [ ] **TEST-001**: Add basic unit tests for controllers (minimum 50% coverage)

### Phase 2 - Data Integration & Real APIs (MEDIUM PRIORITY)  
- [ ] **GARMIN-001**: Apply for Garmin commercial partnership for real API access
- [ ] **GARMIN-002**: Replace simulated data (lines 142-173 in garmin.controller.js) with real API calls
- [ ] **GARMIN-003**: Implement webhook system for real-time Garmin data sync
- [ ] **DB-001**: Create missing models: `WorkoutPlan.model.js`, `NutritionPlan.model.js`, `GarminData.model.js`, `PaymentHistory.model.js`
- [ ] **AI-001**: Integrate real AI chat (OpenAI/Claude API) replacing mock responses
- [ ] **AI-002**: Implement actual food recognition model with TensorFlow.js
- [ ] **NOTIF-001**: Add push notification system (Firebase Cloud Messaging)
- [ ] **NOTIF-002**: Implement email notifications (SendGrid/AWS SES)

### Phase 3 - Production Infrastructure (MEDIUM PRIORITY)
- [ ] **DOCKER-001**: Create Dockerfile and docker-compose.yml for containerization
- [ ] **CI-001**: Set up CI/CD pipeline (GitHub Actions)
- [ ] **MONITOR-001**: Add error monitoring (Sentry integration)
- [ ] **MONITOR-002**: Implement logging and analytics service
- [ ] **BACKUP-001**: Set up MongoDB backup strategy
- [ ] **ENV-001**: Create proper environment management (dev/staging/prod)

### Phase 4 - Code Quality & Polish (LOW PRIORITY)
- [ ] **CLEAN-001**: Remove duplicate component versions (V1/V2 cleanup)
- [ ] **CLEAN-002**: Add error boundaries to all major components
- [ ] **CLEAN-003**: Implement loading states across the application
- [ ] **PWA-001**: Configure Progressive Web App features
- [ ] **TEST-002**: Complete test coverage (80%+ target)
- [ ] **DOCS-001**: Create API documentation with Swagger/OpenAPI

### Phase 5 - Compliance & Legal
- [ ] **GDPR-001**: Implement GDPR compliance (data deletion, export)
- [ ] **HIPAA-001**: Add HIPAA considerations for health data
- [ ] **LEGAL-001**: Create Terms of Service and Privacy Policy
- [ ] **LEGAL-002**: Add cookie consent management

## 🔄 TODO LIST WORKFLOW INSTRUCTIONS

**IMPORTANT**: Before starting any task, check if it corresponds to a TODO item above:

1. **Check TODO Match**: When receiving a prompt, first identify if the work matches any TODO item
2. **Mark as Started**: If starting work on a TODO, mark it as `[🔄 IN PROGRESS]`
3. **Complete and Remove**: When a TODO is completed, mark it as `[✅ COMPLETED]` then remove the line
4. **Stay Focused**: Try to prioritize work according to the Phase order (1 → 2 → 3 → 4 → 5)
5. **Add New TODOs**: If new critical issues are discovered, add them to the appropriate phase

**Example Workflow**:
```
Before: - [ ] **SECURITY-001**: Move hardcoded secrets...
During: - [🔄 IN PROGRESS] **SECURITY-001**: Move hardcoded secrets...
After: Remove the entire line when completed
```

This TODO list should guide all development decisions and ensure systematic progress toward production readiness.