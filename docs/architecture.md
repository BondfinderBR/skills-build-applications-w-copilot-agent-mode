# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep route components responsible for displaying API results; share only the request/loading/error lifecycle, and render accessible loading, empty, and error states.
- Logic tier decision: Keep request validation and capability behavior in explicit service functions; return deliberate 4xx responses for invalid IDs, missing records, and invalid payloads.
- Data tier decision: Put required fields, defaults, and value constraints in the existing Mongoose schemas; keep the existing upsert-only seed behavior and preserve unrelated data.
- Activity tracking approach: Validate positive minutes, activity type, and existing user/team ObjectIds; store the references, use minutes as points, and timestamp accepted activities.
- Team management approach: Require a name, accept mascot and optional member IDs, validate supplied member IDs, and return created/listed teams with their members.
- Leaderboard approach: Sum persisted activity points per team, include teams with zero points, and sort descending with deterministic ranks.
- Workout suggestions approach: Find the requested user by email, prefer a matching focus from the user's goal or recent activity, and return a reason with matching workouts; return 404 for an unknown user.
- Safe implementation order: Data schemas and seed compatibility; API service behavior and contract tests; shared presentation states and route-specific rendering; then full tests and builds.

## Test plan

Record the commands you run and what each failure means.

- Dependency installation: `npm ci --prefix octofit-tracker/backend` and `npm ci --prefix octofit-tracker/frontend`; both completed, with the backend succeeding on retry after a transient MongoDB binary-download rename error.
- MongoDB prerequisite: `ps aux | grep '[m]ongod'`; MongoDB was running as `mongod --dbpath /data/db` before integration tests.
- Red baseline: `npm test --prefix octofit-tracker/backend` reported 8 failed and 1 passed (schema requirements, invalid-request responses, leaderboard aggregation, and workout matching); `npm test --prefix octofit-tracker/frontend` reported 15 failed (API data rendering and loading, empty, and error states).
- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`; failures indicate schema validation or seed idempotency/data-preservation regressions.
- API command: `npm run test:api --prefix octofit-tracker/backend`; failures indicate incorrect validation, resource persistence, leaderboard ordering, or suggestion matching.
- Frontend command: `npm test --prefix octofit-tracker/frontend`; failures indicate API-driven rendering or accessible loading, empty, and error states are incorrect.
- Backend build command: `npm run build --prefix octofit-tracker/backend`; failures indicate TypeScript errors in backend code.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`; failures indicate TypeScript or Vite build errors.
- Final validation: MongoDB was running; `npm test --prefix octofit-tracker/backend` passed (9/9), `npm test --prefix octofit-tracker/frontend` passed (15/15), and both backend and frontend build commands passed.
