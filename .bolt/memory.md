# Project memory

## Product intent & audience

- Next.js app with Supabase auth; includes a signup flow with email verification.
- Product involves managing devices organized into categories, with a "Signal Flow" feature for adding/configuring signals.
- Admin role exists with ability to add and manage categories.
- Full audience and product scope still partially undefined.

## Brand personality & voice

- Not yet inferred.

## Visual design & UX direction

- Auth UX includes a "Please verify your email" screen for unverified users; unverified users are blocked from the main app.
- Category system uses color coding: built-in and custom categories each have an assigned color.
- Device cards visually inherit their category's color across all surfaces: device form preview, admin device cards, Signal Flow sidebar, and placed devices.
- Add Category dialog shows feedback when a selected color is already in use.
- Similar form patterns exist in both category dialog and cable dialog.

## Decisions, constraints & rationale

- Framework: Next.js. Backend/database: Supabase.
- Email verification system is implemented in-app (signup email, resend, status check, redirect on unverified sign-in, return-to-app after confirmation).
- No migrations or schema changes were applied while the database service was unstable; a previous "database redundancy" plan was cancelled by the user.
- Category colors must be unique across all categories (built-in and custom); admins cannot create a category with a color already assigned.
- Device color is derived from its category color, not stored independently; category selection in any flow (including Add Signal Flow) propagates the category color to the device.
- Existing active categories had no duplicate colors at time of implementation.
- Typecheck, production build, and diagnostics all pass.

## Open questions & assumptions

- Supabase provider "email confirmation" must be confirmed enabled; app code expects it.
- Exact env var names and client setup details not yet captured.
- Whether a database-level constraint for unique category colors is needed (currently enforced in UI only).
- Whether existing device records with independently-stored colors need migration to match their category color.
- Audience, branding, and broader visual direction still undefined.