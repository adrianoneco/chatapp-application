# ChatWave

## Overview

ChatWave is a modern messaging application built with a full-stack TypeScript architecture. The application features a Discord/Slack-inspired interface with a strong visual identity through gradient effects and glassmorphism design patterns. It's designed as a utility-focused messaging platform that supports Portuguese language users with proper UTF-8 character support.

The application follows a monorepo structure with shared code between client and server, using Vite for frontend bundling and Express for the backend API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for the UI layer
- Vite as the development server and build tool
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management

**Component Library:**
- shadcn/ui component system (New York style variant)
- Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling with custom design tokens
- Custom theme system supporting dark mode (default) and light mode

**State Management:**
- React Query for server state with custom query client configuration
- Session-based authentication state managed through API queries
- Theme state persisted to localStorage

**Design System:**
- Typography: Inter font family from Google Fonts
- Layout: Fixed header (h-16), fixed sidebar (w-64), responsive collapse on mobile (<768px)
- Color scheme: Gradient-based visual identity (blue-900 → purple-900 → purple-800)
- Glassmorphism effects with backdrop-blur and semi-transparent backgrounds
- Spacing system based on Tailwind's standard units (2, 4, 6, 8, 12, 16, 20)

### Backend Architecture

**Framework & Runtime:**
- Express.js server with TypeScript
- Node.js with ES modules
- Session-based authentication using express-session
- In-memory session store (MemoryStore from memorystore)

**API Design:**
- RESTful API endpoints under `/api` prefix
- Session-based authentication with middleware pattern
- JSON request/response format
- Request logging middleware for API calls

**Authentication:**
- bcryptjs for password hashing
- Session cookies for authentication state
- Protected routes using authenticateMiddleware
- Test user auto-initialization (username: "teste", password: "senha123")

**Code Organization:**
- Monorepo structure with client, server, and shared directories
- Path aliases configured for clean imports (@/, @shared/, @assets/)
- Shared schema definitions between client and server

### Data Storage

**Database:**
- PostgreSQL as the primary database (configured for Neon serverless)
- Drizzle ORM for type-safe database operations
- WebSocket support for Neon serverless connections
- Connection pooling via @neondatabase/serverless

**Schema Design:**
- Users table with UUID primary keys, username (unique), password hash, name, and timestamps
- Zod schemas for runtime validation of insert/update operations
- Type inference from Drizzle schema for compile-time type safety

**Migrations:**
- Drizzle Kit for schema migrations
- Migration files stored in `./migrations` directory
- Push-based migration strategy via `db:push` script

**Data Access Layer:**
- Storage abstraction interface (IStorage) for potential future storage implementations
- DatabaseStorage class implementing the storage interface
- Repository pattern for user operations (getUser, getUserByUsername, createUser)

### External Dependencies

**UI Component Library:**
- shadcn/ui with Radix UI primitives for production-ready components
- Lucide React for icon system
- react-hook-form with Zod resolvers for form validation
- date-fns for date manipulation
- cmdk for command palette functionality
- vaul for drawer components
- embla-carousel-react for carousel functionality
- recharts for data visualization components

**Database & ORM:**
- Neon serverless PostgreSQL (via @neondatabase/serverless)
- Drizzle ORM (drizzle-orm) for database operations
- Drizzle Kit for migrations and schema management
- ws library for WebSocket support in Neon connections

**Authentication & Security:**
- bcryptjs for password hashing (10 rounds)
- express-session for session management
- connect-pg-simple for PostgreSQL session store (installed but not currently used)

**Development Tools:**
- Replit-specific plugins (@replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner)
- TypeScript compiler with strict mode enabled
- ESBuild for server bundling in production
- tsx for TypeScript execution in development

**Build & Deployment:**
- Production build: Client bundled with Vite, server bundled with ESBuild
- Development mode: Vite dev server with HMR, tsx for server execution
- Output: Client static files to `dist/public`, server to `dist/index.js`
- Node.js production server serving static files and API routes