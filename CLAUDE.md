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