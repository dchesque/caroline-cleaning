# Chesque Premium Cleaning - Complete Documentation

**Status:** Production  
**Last Updated:** April 2026  
**Maintainers:** Development Team

---

## 📚 Documentation Index

### Getting Started
- **[GETTING_STARTED.md](GETTING_STARTED.md)** — Installation, environment setup, and first run
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — System design, tech stack, and high-level overview
- **[API.md](API.md)** — All API endpoints, webhooks, and integrations

### Core Features
- **[features/CAROL_AI.md](features/CAROL_AI.md)** — Carol AI secretary implementation and behavior
- **[features/CHAT_SYSTEM.md](features/CHAT_SYSTEM.md)** — Real-time chat, messaging, and session management
- **[features/BOOKING.md](features/BOOKING.md)** — Appointment scheduling, availability, and recurrence
- **[features/ADMIN_PANEL.md](features/ADMIN_PANEL.md)** — Admin dashboard and management features
- **[features/NOTIFICATIONS.md](features/NOTIFICATIONS.md)** — SMS/WhatsApp alerts and reminders

### Development & Operations
- **[DATABASE.md](DATABASE.md)** — Schema, migrations, and data models
- **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** — UI components, styles, and design guidelines
- **[DEVELOPMENT.md](DEVELOPMENT.md)** — Development workflow, testing, and contributing
- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Docker deployment, environment config, and production setup
- **[SECURITY.md](SECURITY.md)** — Authentication, authorization, and data protection

### Product & Planning
- **[PRD.md](PRD.md)** — Product Requirements Document (vision, features, metrics)
- **[ROUTES_SCREENS.md](ROUTES_SCREENS.md)** — Complete routes map and UI screens

### Reference
- **[archive/IMPLEMENTATION_PHASES.md](archive/IMPLEMENTATION_PHASES.md)** — Historical implementation phases (FASE_1-8) for reference
- **[archive/CONTEXT_DOCS.md](archive/CONTEXT_DOCS.md)** — Original context documentation and glossary

---

## 🚀 Quick Links

### For New Developers
1. Start with [GETTING_STARTED.md](GETTING_STARTED.md)
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system overview
3. Read [DEVELOPMENT.md](DEVELOPMENT.md) for workflow guidelines
4. Check [SECURITY.md](SECURITY.md) for auth patterns

### For Feature Development
1. Check [ROUTES_SCREENS.md](ROUTES_SCREENS.md) for UI structure
2. Review relevant feature doc in `features/`
3. Refer to [DATABASE.md](DATABASE.md) for data models
4. Check [API.md](API.md) for backend endpoints

### For Operations
1. Read [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
2. Review [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for brand consistency
3. Check feature docs for integration details

---

## 📋 Project Overview

**Chesque Premium Cleaning** is a complete platform that combines:

- **Carol AI**: 24/7 automated customer service secretary
- **Landing Page**: Premium lead capture and conversion
- **Chat System**: Real-time client-company communication
- **Admin Panel**: Full operational management (scheduling, CRM, financials)
- **Webhooks**: n8n integration for automation
- **Notifications**: SMS/WhatsApp alerts via Twilio

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **UI**: Tailwind CSS + shadcn/ui
- **Integrations**: n8n, Twilio, OpenRouter
- **Deployment**: Docker + Easypanel

---

## 🔄 Documentation Structure

Each document is self-contained but links to related docs. Start from this README and navigate based on your needs:

```
README (you are here)
  ├── Getting Started & Setup
  │   ├── GETTING_STARTED.md
  │   ├── ARCHITECTURE.md
  │   └── DEVELOPMENT.md
  │
  ├── Features & Implementation
  │   ├── features/
  │   ├── API.md
  │   ├── DATABASE.md
  │   └── ROUTES_SCREENS.md
  │
  ├── Design & UX
  │   └── DESIGN_SYSTEM.md
  │
  ├── Production & Security
  │   ├── DEPLOYMENT.md
  │   └── SECURITY.md
  │
  └── Reference & Archive
      └── archive/
```

---

## ❓ Finding What You Need

| I want to... | Read this |
|---|---|
| Set up the app locally | [GETTING_STARTED.md](GETTING_STARTED.md) |
| Understand the system architecture | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Build a new feature | [features/](features/) + [ROUTES_SCREENS.md](ROUTES_SCREENS.md) |
| Query the database | [DATABASE.md](DATABASE.md) |
| Deploy to production | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Implement security/auth | [SECURITY.md](SECURITY.md) |
| Design a UI component | [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) |
| Integrate with n8n | [API.md](API.md) + [features/CAROL_AI.md](features/CAROL_AI.md) |
| Understand Carol AI | [features/CAROL_AI.md](features/CAROL_AI.md) |
| Check all API endpoints | [API.md](API.md) |
| Review app routes | [ROUTES_SCREENS.md](ROUTES_SCREENS.md) |

---

## 📝 Documentation Standards

- All docs use **Markdown** with clear headings and navigation
- Code examples are **tested** and follow project conventions
- Each doc has a **Table of Contents** at the top
- Links between docs use relative paths for portability
- Historical docs are moved to `archive/` with explanatory notes

---

## 🤝 Contributing to Docs

When updating documentation:

1. Keep docs **synchronized** with code changes
2. Add a **timestamp** when updating a doc
3. Link related docs together
4. Move outdated docs to `archive/` instead of deleting
5. Update this README's index if adding new docs

---

## 📞 Support

For questions or clarifications:
- Check the relevant doc first
- Review [DEVELOPMENT.md](DEVELOPMENT.md) for workflow guidelines
- Check [SECURITY.md](SECURITY.md) for auth/permissions issues
- Review git history: `git log --grep="<feature>"` for context

---

**Last maintained:** 2026-04-09  
**Next review:** Quarterly or after major features
