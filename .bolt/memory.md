# Project memory

## Product intent & audience

- Next.js app with Supabase auth; includes a signup flow with email verification.
- Audience and full product scope still undefined.

## Brand personality & voice

- Not yet inferred.

## Visual design & UX direction

- Auth UX includes a "Please verify your email" screen for unverified users.
- Unverified users are blocked from entering the main app.

## Decisions, constraints & rationale

- Framework: Next.js.
- Backend/database: Supabase.
- Email verification system is implemented in-app:
  - Verification email sent on signup.
  - Resend-verification and check-verification-status features exist.
  - Unverified users cannot access the main app; sign-in with unverified email redirects to verification screen.
  - Verification link returns the user to the app after confirmation.
- No migrations or schema changes were applied while the database service was unstable; data left untouched.
- A previous "database redundancy" plan was cancelled by the user.

## Open questions & assumptions

- Supabase provider setting "email confirmation" must be confirmed as enabled; app code expects it, but if disabled users may bypass verification.
- Exact env var names and client setup details not yet captured.
- Audience, branding, and visual direction still undefined.