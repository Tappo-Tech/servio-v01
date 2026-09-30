# TAPPO

> **TAPPO is a Saudi FoodTech platform that helps cafés and restaurants serve faster, operate smarter, and grow through QR-powered ordering.**

TAPPO is an early-stage Saudi FoodTech product built to modernize the café and restaurant experience. It connects guests, service teams, and managers through QR-based table ordering, real-time operations, and practical business insights.

Guests scan a table QR code, browse the menu, place an order, request a waiter, and leave feedback — without downloading an app. Managers and cashiers receive live updates through a focused Arabic-first dashboard built for daily hospitality operations.

TAPPO is currently validating the problem, product demand, and market fit in Saudi Arabia ahead of formal company registration and incubation applications.

---

## Why TAPPO

Cafés and restaurants lose time and revenue when ordering, waiter requests, and operational follow-up depend on fragmented tools or manual communication.

TAPPO brings the core workflow into one system:

- **Faster ordering:** customers order directly from their table.
- **Better service:** waiter calls and new orders reach the team in real time.
- **Clearer operations:** managers and cashiers work from tenant-scoped dashboards.
- **More useful feedback:** customer reviews are collected and surfaced to management.
- **Lower friction:** no customer account or mobile app is required.

## Product capabilities

### Guest experience

- QR-based menu access by café slug and table number.
- Arabic-first, responsive menu experience with RTL layout.
- Menu categories, search, item details, allergens, tags, and recommendations.
- Cart and table-specific order placement.
- One-tap waiter calls and bill/service requests.
- Customer ratings and feedback.

### Manager and cashier operations

- Separate manager and cashier access.
- Supabase Auth for manager accounts.
- Tenant-scoped cashier login using café slug, username, and PIN.
- Cashier management from the settings area.
- Live order updates and waiter-call notifications.
- Browser notification sounds for new orders and waiter calls.
- Order status workflow and order history.
- Menu item and category CRUD.
- Store profile, branding, currency, and café slug management.
- Table generation and printable QR cards.
- Analytics and feedback views.
- Secure sign-out for managers and cashiers.

### QR and table operations

Each generated QR code points to the canonical table URL:

```text
/menu/{cafe-slug}/{table-number}
```

QR cards use high error correction and can be printed individually or in bulk.

## Product status

**Current stage:** Initial experimental MVP / pre-incubation validation.

TAPPO is not yet formally registered as a company. The team is currently validating the need, user demand, and market fit in Saudi Arabia before applying to an incubator and proceeding with formal registration.

The current repository includes the core ordering, tenant isolation, authentication, realtime operations, QR, RTL, and manager workflow foundations. A public production launch still requires environment configuration, reliable email delivery, deployment setup, legal/commercial decisions, and full end-to-end acceptance testing with real cafés and restaurants.

## Technical architecture

```text
Guest browser
    │
    ├── QR menu and table route
    ├── Public tenant-safe RPCs
    └── Order / waiter call / feedback actions
            │
            ▼
React application ── Supabase Auth
    │                    │
    ├── Manager dashboard │
    ├── Cashier dashboard │
    ├── Tenant context    │
    └── Realtime channels │
                         ▼
                 PostgreSQL + RLS
                 tenants, menu, tables,
                 orders, waiter calls,
                 feedback, profiles, cashiers
```

### Main stack

- **Frontend:** React 18, React Router, Material UI.
- **Backend:** Supabase PostgreSQL, Auth, RPCs, Realtime, Edge Functions.
- **Data isolation:** tenant IDs, PostgreSQL Row Level Security, scoped policies.
- **Realtime:** Supabase Broadcast with Postgres Changes fallback.
- **QR:** `qrcode.react`.
- **Language and layout:** Arabic-first UI with global RTL support.
- **Build tooling:** Create React App / `react-scripts`.

## Repository structure

```text
src/
├── components/                 Reusable UI and dashboard components
├── context/                    Tenant, auth-adjacent, menu, orders, tables, and realtime state
├── pages/                      Menu, login, registration, and dashboard screens
├── theme/                      Material UI theme and RTL configuration
├── utils/                      Image compression, notifications, and logout helpers
└── supabase.js                 Browser Supabase client

supabase/
├── functions/cashier-login/    Secure cashier session Edge Function
└── migrations/                 Tenant, RLS, auth, realtime, and performance migrations

public/                         Static assets and optimized logo files
```

## Local development

### Requirements

- Node.js 18+ recommended.
- npm 9+ recommended.
- A Supabase project with the required migrations applied.

### Installation

PowerShell:

```powershell
git clone https://github.com/Tappo-Tech/tappo-v01.git
cd tappo-v01
npm ci
Copy-Item .env.example .env
notepad .env
npm start
```

macOS / Linux:

```bash
git clone https://github.com/Tappo-Tech/tappo-v01.git
cd tappo-v01
npm ci
cp .env.example .env
nano .env
npm start
```

The development server runs at:

```text
http://localhost:3000
```

## Environment variables

The browser app requires only the public Supabase configuration:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_KEY=your_supabase_anon_or_publishable_key
```

Use the public **anon / publishable** key only. Never put the following in the frontend `.env` file:

- Supabase `service_role` key.
- Database password.
- Any private server secret.

`.env` is intentionally ignored by Git. `.env.example` is the safe, tracked template.

## Email verification

Manager registration uses Supabase Auth email sign-up with a redirect back to `/login`.

When **Confirm email** is enabled in Supabase Auth:

1. The manager submits the registration form.
2. TAPPO creates the tenant and sends an activation email.
3. TAPPO shows a verification screen.
4. The manager can resend the activation email.
5. The manager confirms the email and then signs in.

Configure in Supabase:

- **Authentication → Providers → Email → Confirm email:** enabled.
- **Authentication → URL Configuration → Site URL:** the production URL.
- **Redirect URLs:** include the local and production login URLs.

## Supabase and deployment notes

Before deploying a new environment:

1. Configure the project URL and public key.
2. Apply the migrations in `supabase/migrations/`.
3. Deploy the `cashier-login` Edge Function.
4. Configure Supabase Auth email confirmation and redirect URLs.
5. Configure an SMTP provider for reliable production email delivery.
6. Run manager, cashier, guest ordering, QR, realtime, and sign-out acceptance tests.

## Available scripts

```bash
npm start          # Start the development server
npm run build      # Create a production build
npm test           # Run the test runner
```

## Security principles

- Every business record is associated with a tenant.
- RLS policies restrict authenticated access to the current tenant.
- Public menu operations use dedicated tenant-aware RPCs.
- Cashier PINs are verified server-side and are not stored as plain text.
- Service-role credentials must remain server-side.
- Sign-out clears both the Supabase session and the local cashier marker.

## Performance work included

- Optimized static logo asset in WebP format.
- Client-side compression for uploaded menu and café images.
- Tenant and foreign-key indexes for common database access paths.
- Narrow tenant-scoped queries in dashboard contexts.
- Realtime subscriptions cleaned up when dashboard contexts unmount.

## Roadmap

> The roadmap below is a product planning draft and should be confirmed by the TAPPO team.

- Production deployment pipeline and preview environments.
- Automated unit, integration, and end-to-end tests.
- Receipt printing and POS integrations.
- Payment and online settlement integrations.
- Multi-branch organization management.
- Staff roles and permissions beyond manager/cashier.
- Inventory and procurement workflows.
- Deeper analytics and exportable reports.
- Push notifications and mobile staff experience.

## Contributing

1. Create a feature branch from `main`.
2. Keep tenant isolation and RLS behavior intact.
3. Do not commit `.env`, service-role keys, or customer data.
4. Run `npm run build` before opening a pull request.
5. Describe the user impact and database impact of each change.

## Team

### Mohamed Elhag Mohamed Eshag — Founder, CEO & Tech Lead

Mohamed is TAPPO's principal founder and leads product direction, technical strategy, and frontend engineering.

- GitHub: [codemo-dev](https://github.com/codemo-dev)
- LinkedIn: [Mohamed Eshag](https://www.linkedin.com/in/codemo-dev)
- Portfolio: [codemo-dev.netlify.app](https://codemo-dev.netlify.app/)
- X: [@MohamedEshagx](https://x.com/MohamedEshagx)
- Email: [mohamed.eshagx@gmail.com](mailto:mohamed.eshagx@gmail.com)

### Amin Ehab Ahmed Bakhit — Co-founder & COO

Amin is a co-founder responsible for operations, execution, and helping shape TAPPO's path from product validation to market readiness.

- LinkedIn: [Amin Bakhit](https://www.linkedin.com/in/amin-tappo-3a9249438)
- Email: [amintappo@gmail.com](mailto:amintappo@gmail.com)

### Mujahid Abbas Alhassan Alamin — Co-founder

Mujahid is a member of the founding team. His public profile and contact details will be added after confirmation.

## Contact and links

- Product stage: Initial experimental MVP / pre-incubation
- Primary market: Saudi Arabia
- Product website: Coming soon
- Support and general contact: [tappo.app.sa@gmail.com](mailto:tappo.app.sa@gmail.com)
- Company LinkedIn: Coming soon
- Company X: [@tappoApp](https://x.com/tappoApp)
- Repository: [Tappo-Tech/tappo-v01](https://github.com/Tappo-Tech/tappo-v01)

The company LinkedIn page is not publicly available yet. It should be added here once the official page is created or linked from a founder profile.

## Commercial and licensing status

TAPPO is **not open source** at this stage. The repository is a private product codebase intended for the founding team and authorized collaborators. Until the company is formally registered and its intellectual-property ownership is documented, the safest practical position is to keep the repository private and use a **proprietary / all-rights-reserved** notice.

This README is product documentation, not legal advice. Before public launch or onboarding external contributors, the team should confirm ownership, founder IP assignment, contributor agreements, privacy terms, customer terms, and the final commercial license with a qualified lawyer in Saudi Arabia.

## License

**Proprietary — All rights reserved.**

No permission is granted to copy, modify, distribute, sublicense, or use this software commercially without written permission from TAPPO's authorized owners. This notice should be reviewed and formalized when the company is registered.
