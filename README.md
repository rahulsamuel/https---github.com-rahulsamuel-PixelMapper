# MapMyLED

Advanced LED Screen Mapping, Simplified.

MapMyLED is a powerful web-based tool for designing, documenting, and generating configurations for professional LED video walls.

## Features

- Custom LED tile layouts with half-tiles support
- Advanced data and power wiring visualization
- Multi-processor support (Brompton, Novastar, Helios)
- Raster map generation with slicing
- Project import/export
- LED Calculator for power and data requirements
- Rack Drawing tool for equipment planning

## Tech Stack

- Next.js 15
- Supabase (Database & Authentication)
- TypeScript
- Tailwind CSS
- Shadcn/ui Components

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables in `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:9003](http://localhost:9003) in your browser.

## Database

The application uses Supabase for data persistence with Row Level Security (RLS) enabled on all tables.

## Authentication

Email/password authentication is enabled via Supabase Auth.
