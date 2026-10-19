<div align="center">
  <img src="public/logo-icon.webp" alt="SERVIO logo" width="88" />
  <h1>SERVIO</h1>
  <p><strong>Serve faster. Operate smarter. Grow with every table.</strong></p>
  <p>An Arabic-first hospitality platform for smoother ordering and daily operations.</p>
  <p>
    <a href="https://servio-mvp.vercel.app/">Explore SERVIO</a>
    &nbsp;·&nbsp;
    <a href="mailto:serviotech.sa@gmail.com">Contact us</a>
  </p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/stage-MVP%20validation-f59e0b?style=flat-square" alt="MVP validation" />
  <img src="https://img.shields.io/badge/market-Saudi%20Arabia-0b6e4f?style=flat-square" alt="Saudi Arabia" />
  <img src="https://img.shields.io/badge/category-Hospitality%20Tech-2563eb?style=flat-square" alt="Hospitality technology" />
  <img src="https://img.shields.io/badge/license-Proprietary-111827?style=flat-square" alt="Proprietary software" />
</p>

## About SERVIO

SERVIO helps cafés and restaurants bring the guest experience and daily service operations together. Guests open a digital menu from a table QR code, browse and place an order, and connect with the service team in their browser—without installing an app. Staff manage requests from a responsive workspace built with an Arabic-first, right-to-left experience.

SERVIO is an MVP focused on validating practical hospitality workflows in Saudi Arabia.

## What SERVIO offers

| Guest experience | Team operations |
|---|---|
| Table-specific digital menus | Role-appropriate manager and cashier workspaces |
| Menu browsing, search, and recommendations | Live order handling and cashier point of sale |
| Order placement and progress updates | Menu, pricing, and ingredient availability management |
| Service requests and customer feedback | Shift, sales, and operational summaries |
| Responsive browser access with no app download | Customer receipts and kitchen tickets |

## How it works

```text
Scan a table QR → Browse the menu → Place an order → Team manages the request
```

## Technology

- **Frontend:** React, React Router, and Material UI.
- **Backend services:** Supabase.
- **Hosting:** Vercel.
- **Interface:** responsive layouts, Arabic-first copy, and right-to-left support.

## Run locally

### Requirements

- Node.js 18 or newer
- npm
- A Supabase development project for features that require backend data

### Setup

```bash
git clone https://github.com/Tappo-Tech/servio-v01.git
cd servio-v01
npm ci
cp .env.example .env
npm start
```

Configure local values using `.env.example` as a guide. Do not commit credentials or customer data. The development server runs at `http://localhost:3000`.

### Common commands

```bash
npm start       # Start the development server
npm test        # Run tests
npm run build   # Build the production bundle
```

## Project structure

```text
src/                  Web application: pages, components, state, and utilities
supabase/             Database migrations and backend functions
public/               Static assets and brand resources
```

## Contributing

1. Create a focused branch for each change.
2. Keep the guest and staff experiences responsive and accessible.
3. Add or update tests when behavior changes.
4. Run tests and a production build before opening a pull request.
5. Never commit credentials, private keys, or real customer information.

## License

SERVIO is proprietary software. All rights are reserved. No permission to copy, modify, distribute, or use the software is granted without written authorization.

## Connect

- **Email:** [serviotech.sa@gmail.com](mailto:serviotech.sa@gmail.com)
- **X:** [@Servio_Tech](https://x.com/Servio_Tech)
- **LinkedIn:** [SERVIO Tech](https://www.linkedin.com/company/servio-tech)
- **Product:** [servio-mvp.vercel.app](https://servio-mvp.vercel.app/)
