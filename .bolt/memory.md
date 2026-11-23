# Project memory

## Product intent & audience

- Next.js app with database-backed functionality; specifics not yet established.

## Brand personality & voice

- Not yet inferred.

## Visual design & UX direction

- Not yet inferred.

## Decisions, constraints & rationale

- Framework: Next.js.
- Backend/database: Supabase.
- App-side connection setup is present and uses expected public environment variable names.
- RLS / table-level security is in scope as a potential failure surface (not the current cause).
- No migrations or schema changes were applied while the database service was unstable; data left untouched.

## Open questions & assumptions

- Database service instability: project-management endpoint responds, but table/security/migration queries time out. Root cause and recurrence pattern unknown.
- Assume connection failure is service-side, not code-side, until proven otherwise.
- Exact env var names and client setup details not yet captured.
- Audience, product scope, branding, and visual direction still undefined.