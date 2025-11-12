## Quick orientation — what this repo is

- Frontend React + TypeScript app built with Vite (see `package.json` and `vite.config.ts`).
- UI: MUI (v5) + Emotion, theme located at `src/theme/theme.ts`.
- Routing: `react-router` with guarded routes via `src/components/ProtectedRoute.tsx` and layout in `src/components/Layout.tsx`.
- Authentication: `src/context/AuthContext.tsx` stores JWT in `localStorage` under keys `authToken` and `user` and exposes `useAuth()` for components.

## How to run and build (developer workflow)

- Development: npm run dev — Vite dev server (port 5190). The dev server proxies `/api` to the backend defined in `vite.config.ts` (`http://localhost:3001` by default).
- Build: npm run build — runs `tsc -b` then `vite build`.
- Preview production bundle locally: npm run preview.
- Code formatting: npm run pretty (Prettier).

If you need to point the frontend at a different backend in development or CI, set `VITE_API_BASE_URL` (the client falls back to `/api`).

## Important environment variables / keys

- VITE_API_BASE_URL — optional; defaults to `/api` (proxied in dev).
- VITE_GOOGLE_MAPS_API_KEY — used by `src/services/api.ts` and map components (many pages check for its presence and show a warning if missing).
- Google OAuth client ID is currently hard-coded in `src/App.tsx` (consider moving to an env var if changing it).

## API surface & conventions (single source of truth)

- All server calls go through `src/services/api.ts`. The file defines `api = axios.create({ baseURL })` and attaches a request interceptor that reads `localStorage.authToken` and sets Authorization Bearer header. Update here if auth changes.
- REST shape conventions:
  - Trip root: `/trips` (list, create, get by id, update, delete).
  - Sub-resources use nested routes: `/trips/:tripId/flights`, `/trips/:tripId/hotels`, `/trips/:tripId/rides`, `/trips/:tripId/attractions` (POST to add, DELETE with index to remove).
  - Special backend helpers: `/flights/search-*`, `/hotels/*`, `/places/*`, `/rides/*` and `/trips/:id/share` (see `api.ts` for full list).

Examples (from code):

- Creating a trip: `createTrip({ name, destinations, startDate, endDate })` -> returns Trip.
- Updating checklist (user-specific): `updateUserChecklist(tripId, checklist)` — used by `src/components/TripChecklist.tsx` and `TripDetails`.

## Auth & session patterns you must follow

- AuthContext decodes Google JWT credential on sign-in and writes `authToken` + `user` to localStorage. Components call `useAuth()` to read `user` and `isAuthenticated`.
- The axios interceptor in `src/services/api.ts` trusts the `authToken` key; if you change storage or key names, update both `AuthContext` and the interceptor.

## Date/time & serialization quirks

- Several components accept both ISO `YYYY-MM-DDTHH:mm:ss` and a space-separated datetime (e.g., `YYYY-MM-DD HH:mm+TZ`). `src/pages/TripDetails.tsx` contains helper functions that handle both formats — use them as examples when parsing or formatting trip datetimes.

## UI / patterns to mimic when contributing

- MUI + sx styling is used per-component; prefer `sx` objects for local styles rather than global CSS.
- The app commonly favors: small helper components, controlled components for forms (see `src/pages/NewTripWizard.tsx` and `src/components/AddItemForms.tsx`).
- Error UI: pages show `Alert` components with `error` strings set from catch blocks — prefer surfacing server error messages where possible.

## Map & external integrations

- Google Maps / Places: `@react-google-maps/api` and backend helpers (hotel autocomplete, places autocomplete) are used. Components check `GOOGLE_MAPS_API_KEY` from `src/services/api.ts` and show warnings if missing.
- Flights/hotels/rides rely on backend endpoints — the frontend expects the backend to implement the same nested routes and response shapes found in `src/services/api.ts`.

## Common edits the agent may be asked to do (and where to look)

- Add a new API call: update `src/services/api.ts` and then update any callers (pages/components).
- Change auth/storage key: update `src/context/AuthContext.tsx` + `src/services/api.ts` interceptor + any direct localStorage reads.
- Add env-configured Google client ID: modify `src/App.tsx` (currently hard-coded) and update README/CI.
- Fix date parsing/format: examine `TripDetails.tsx` helpers to keep consistent handling across pages.

## Files to open first (fast path)

- `src/services/api.ts` — API contract and env var usage.
- `src/context/AuthContext.tsx` — auth flow, localStorage keys, login behavior.
- `vite.config.ts` — dev proxy (important for running against local backend).
- `src/pages/NewTripWizard.tsx` and `src/pages/TripDetails.tsx` — canonical examples for creating/updating trips and handling trip data shapes.

If anything here is unclear or you'd like me to include extra examples (payload shapes, or a small mocked backend for local dev), tell me what you want and I will iterate.

## Git workflow (how we work on code)

- Base branch for active development is `dev`. Start new features from an up-to-date `dev` branch.
- Ensure a clean working area before branching: run `git checkout dev && git pull && git status` and stash or commit any local changes.
- **Always create a feature branch** named descriptively, e.g. `feat/add-smart-checkout` or `fix/hotel-autocomplete`. Do not commit directly to `dev`.
- Before making any changes, **always check your current branch** using `git status` or `git branch` to ensure you are on the correct feature branch.
- Push your feature branch to the remote repository to ensure it is up-to-date.
- Keep commits small and focused: each commit should represent a single logical change (SRP for commits). Avoid grouping unrelated changes in one commit so code review can target intent.
- Write clear commit messages (one-line summary + optional body). Prefer present-tense verbs: "Add X", "Fix Y".
- Open a Pull Request from your feature branch into `dev` when the feature is ready. Include a short description, relevant screenshots, and link any issue/QA steps.
- **Before opening a PR, ensure the branch history is clean**: squash any fixup commits and rebase interactively if needed. Use `git rebase -i` to combine commits, and always explain the steps to the user when performing such actions.
- During review, be prepared to address requested changes with additional small commits. Rebase/squash when appropriate before merging to keep `dev` history clear (follow project policy).

These practices make it straightforward to review and bisect changes later.
