# fradflow — Frontend

Enterprise accounting/ERP frontend. React + Vite + Redux Toolkit (RTK Query) + React Router + react-hook-form/zod.

## Getting started
```bash
npm install
npm run dev       # http://localhost:5173
npm run build
```

Set `VITE_API_BASE_URL` in `.env` (or `.env.development` / `.env.production`) to point at your Spring Boot backend.
Expected auth endpoints (see `src/config/api.config.js`):
- `POST /auth/login`      → `{ user, token, refreshToken? }`
- `GET  /auth/me`         → current user
- `POST /auth/logout`
- `POST /auth/forgot-password` → `{ email }`
- `POST /auth/reset-password`  → `{ token, password }`

Adjust these paths/response shapes to match your controllers in `api.config.js` and `authApi.js`.

## What's implemented
- Project scaffold, design tokens, global styles (ledger/accounting visual identity)
- Common components: `Button`, `Input`, `Loader`, `ErrorMessage`
- `AuthLayout` (split-screen brand/form layout)
- Full **auth** feature: Login, Forgot password, Reset password — forms, validation (zod),
  RTK Query API layer, Redux slice for session state, 401 → auto session-expiry handling,
  `ProtectedRoute` guard, `useAuth` hook
- Routing skeleton (`AppRoutes`) with a placeholder `DashboardPage` so the flow is
  demonstrable end-to-end (login → protected route → logout)

## What's still to build (not started)
company, user, role, permission, product, customer, supplier, sales, purchase, payment,
expense, stock, accounting, reporting — plus the real `MainLayout`/`Header`/`Sidebar`/
`CompanySelector` shell that the dashboard and all business features will live inside,
and `Table`/`Modal`/`Pagination`/`Select`/`DatePicker`/`ConfirmDialog` common components
that those features will need.

## Architecture notes (see full rationale in project chat)
- **RTK Query instead of slice+saga+api per feature** — one `*Api.js` per feature gives
  you caching, loading/error state, and cache invalidation for free. Redux slices are used
  only for genuinely client-side state (e.g. `authSlice` holds session/user, not server data).
  Reach for a saga/listener only where you need real orchestration (websocket streams,
  debounced search-as-you-type with cancellation) — not for plain CRUD.
- **Feature-based folders** (`features/<name>/{pages,components,*Api.js,*Slice.js}`) —
  kept from your original structure; it scales far better for an app this size than
  type-based folders at the root.
"# tradFlow_UI" 
