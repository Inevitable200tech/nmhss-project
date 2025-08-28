# Navamukunda HSS Website

## Overview

This is a modern school website for Navamukunda Higher Secondary School in Thirunavaya, built as a single-page application showcasing the school's heritage, academics, achievements, and facilities. The application serves as a digital presence for the 77-year-old educational institution, providing information to prospective students, parents, and the community while enabling contact through an integrated form system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design system
- **UI Components**: Radix UI primitives providing accessible, unstyled components
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for both frontend and backend consistency
- **API Pattern**: RESTful endpoints under `/api/*` namespace
- **Development Server**: Vite middleware integration for seamless full-stack development
- **Static Serving**: Express serves built frontend assets in production

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless database hosting
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Management**: Drizzle Kit for database schema migrations and management
- **Temporary Storage**: In-memory storage interface with MemStorage implementation for development

### Authentication and Authorization
- **Current State**: Basic structure in place with user schema
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Future Implementation**: Authentication system prepared but not yet implemented

### External Dependencies
- **Database Hosting**: Neon serverless PostgreSQL database
- **Fonts**: Google Fonts (Inter, Architects Daughter, DM Sans, Fira Code, Geist Mono)
- **Icons**: Lucide React icon library
- **Image Hosting**: Unsplash for stock photography
- **Development Tools**: Replit integration for cloud development environment
- **Form Validation**: Zod for runtime type validation and react-hook-form for form management

### Key Design Decisions

**Monorepo Structure**: Single repository with shared types and schemas between frontend and backend in `/shared` directory, promoting code reuse and type consistency.

**Component Architecture**: Modular section-based components (Hero, About, Academics, etc.) for maintainable and reusable code structure.

**Database Schema**: Prepared for multiple content types (users, contact messages, events, news) with UUID primary keys and timestamp tracking.

**Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints and mobile navigation patterns.

**Performance Optimization**: React Query for intelligent caching, Vite for fast builds, and optimized asset loading.

**Development Experience**: Hot module replacement, TypeScript strict mode, and comprehensive error handling for smooth development workflow.

## Recent Changes

**August 28, 2025 - Major Visual Enhancement Update:**
- ✅ Added AOS (Animate On Scroll) library for smooth scroll animations
- ✅ Enhanced CSS with advanced animations and visual effects:
  - Glass morphism navigation and components
  - Enhanced gradient backgrounds and hover effects
  - Pulse animations for call-to-action buttons
  - Floating animations for interactive elements
  - Card shimmer effects on hover
- ✅ Applied responsive design improvements with clamp() functions
- ✅ Added comprehensive AOS animations throughout all sections:
  - Hero: Staggered fade-up animations with delays
  - About: Slide animations for content blocks
  - Academics: Left/right slide animations for cards
  - Achievements: Flip animations for statistics
  - Faculty: Zoom-in effects for department cards
  - Events: Slide-up animations for calendar
  - Contact: Left slide animations for forms and info
- ✅ Enhanced hero section with improved gradient overlay and parallax effect
- ✅ Fixed backend storage implementation for contact forms, events, and news
- ✅ Improved visual hierarchy with gradient text effects