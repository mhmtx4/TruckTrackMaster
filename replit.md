# replit.md

## Overview

This is a full-stack TIR (truck) tracking and document management system built with React frontend and Express.js backend. The system allows admin users to create TIR profiles, upload and manage documents, and share read-only links for both individual TIR profiles and complete listing pages. The application uses modern technologies including Drizzle ORM for database management, Cloudinary for file storage, and shadcn/ui components for the user interface.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared code:

- **Frontend**: React with TypeScript, using Vite for build tooling
- **Backend**: Express.js with TypeScript, RESTful API design
- **Database**: PostgreSQL with Drizzle ORM (configured but using in-memory storage currently)
- **File Storage**: Cloudinary for document uploads
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management

## Key Components

### Frontend Architecture
- **React Router**: wouter for client-side routing
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: TanStack Query for API calls and caching
- **Styling**: Tailwind CSS with CSS variables for theming

### Backend Architecture
- **Express.js**: RESTful API server
- **Storage Layer**: Abstract storage interface with in-memory implementation
- **File Upload**: Multer middleware for handling multipart/form-data
- **Validation**: Zod schemas shared between client and server

### Database Schema
- **TIR Profiles**: Core entity with phone (required), plate, trailer plate, location fields
- **Documents**: File metadata with Cloudinary URLs and categorization
- **Share Links**: Token-based sharing system with expiration support

### Authentication & Authorization
- Currently admin-only system (no authentication implemented)
- All endpoints assume admin access
- Public endpoints for shared links with token-based access

## Data Flow

1. **TIR Management**: Admin creates/edits TIR profiles through forms
2. **Document Upload**: Files uploaded to Cloudinary, metadata stored in database
3. **Sharing**: Admin generates shareable tokens for TIR profiles or complete lists
4. **Public Access**: Anonymous users access shared content via tokens

### API Endpoints
- `GET/POST /api/tirs` - TIR profile management
- `POST /api/tirs/:id/documents` - Document upload
- `POST /api/tirs/:id/share` - Generate TIR share links
- `GET /api/public/tir/:token` - Public TIR access
- `GET /api/public/list/:token` - Public list access

## External Dependencies

### Core Dependencies
- **Database**: Drizzle ORM with PostgreSQL adapter
- **File Storage**: Cloudinary v2 SDK
- **UI Components**: Radix UI primitives via shadcn/ui
- **Validation**: Zod for schema validation
- **Date Handling**: date-fns for Turkish locale support

### Development Tools
- **TypeScript**: Strict type checking enabled
- **Vite**: Frontend build tool with HMR
- **ESBuild**: Backend bundling for production
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

### Build Process
- `npm run build`: Builds both frontend (Vite) and backend (ESBuild)
- Frontend assets compiled to `dist/public`
- Backend compiled to `dist/index.js` as ESM module

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `CLOUDINARY_*`: Cloudinary configuration (cloud_name, api_key, api_secret)

### Production Considerations
- Static file serving through Express
- Database migrations via Drizzle Kit
- File size limits (10MB for uploads)
- CORS and security headers needed for production

## Changelog

```
Changelog:
- June 28, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```