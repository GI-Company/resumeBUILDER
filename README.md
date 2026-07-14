# Agent Rez

Agent Rez is a high-performance, AI-powered resume builder designed to help users create, manage, and refine professional resumes. Built with a focus on precision, speed, and data integrity.

## Core Features

- **Agent Rez AI Tools**: Leverage state-of-the-art LLMs (via Gemini) to parse existing resumes, refine professional summaries, and rewrite experience bullet points using STAR method principles.
- **Intelligent Resume Builder**: A fluid, reactive UI allowing for deep customization of layout, typography, and styling.
- **Robust Cloud Persistence**: Real-time autosave to both local storage and a secure PostgreSQL backend (via Supabase).
- **Resume Management**: Track active resumes, manage trash/archives, and enforce user-specific limits on resume count.
- **Secure Authentication**: Supabase-powered authentication with email/OTP verification.

## Architecture Highlights

- **Frontend**: React 18+ with Vite, TypeScript, Tailwind CSS, and Framer Motion for animations.
- **Backend**: Supabase (PostgreSQL 15+) for secure data persistence, RLS (Row-Level Security), and RPC-driven state management to ensure ACID compliance.
- **AI Integration**: Server-side proxy API routes to securely handle model interactions, ensuring API keys remain protected.

## Getting Started

To run the project locally:

1. Clone the repository.
2. Install dependencies: `npm install`.
3. Set up environment variables based on `.env.example`.
4. Run the development server: `npm run dev`.
