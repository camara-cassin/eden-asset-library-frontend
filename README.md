# EDEN Asset Library Frontend

Onboarding and browsing UI for the EDEN Asset Library backend.

## Tech Stack

- **Framework**: React with Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **HTTP Client**: Axios
- **Server State**: React Query (TanStack Query)
- **Routing**: React Router

## Prerequisites

- Node.js 18+
- npm or yarn
- EDEN Asset Library Backend running at `http://localhost:8000`

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

The `VITE_API_URL` should point to your backend API base URL.

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Building for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  api/           # API client and endpoint functions
    client.ts    # Axios HTTP client wrapper
    assets.ts    # Asset CRUD operations
    reference.ts # Reference data endpoints
    contributors.ts # Contributor endpoints
  components/    # Reusable UI components
    Layout.tsx   # Main layout with navigation
    ui/          # shadcn/ui components
  pages/         # Route page components
  types/         # TypeScript type definitions
    asset.ts     # EdenAsset types matching backend schema
  App.tsx        # Main app with routing
  main.tsx       # Entry point
```

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Dashboard | Asset listing with filters and search |
| `/assets/new` | Create Asset | Create a new draft asset |
| `/assets/:id/edit` | Edit Asset | Multi-step asset editing |
| `/assets/:id` | Asset Details | Read-only asset view |
| `/public` | Public Browse | Browse approved assets |
| `/public/:id` | Public Asset Details | View approved asset details |

## Color Scheme

- **Primary Blue**: #1B4FFF (buttons, accents, links)
- **Dark Blue**: #0F2C8C (top bar, strong text)
- **Light Blue**: #E6EEFF (subtle backgrounds, highlights)
- **White**: #FFFFFF (main background)
- **Primary Text**: #1A1A1A
- **Secondary Text**: #4A4A4A
- **Soft Gray**: #F5F6FA (panels, sections)
- **Divider Gray**: #D8D8D8 (borders)

## Current Status

This is the initial scaffolding with basic UI screens:

- Dashboard with asset listing and filtering
- Create Asset form (basic fields)
- Edit Asset form (basic fields, file attachment, AI prefill modals)
- Asset Details view with tabs
- Public Browse with card layout
- Public Asset Details view

**Not yet implemented** (pending further instruction):
- Deep form validation logic
- Autosave functionality
- Production-grade styling
