# SERVIO

> **Serve faster. Operate smarter. Grow with every table.**

SERVIO is an Arabic-first hospitality platform built to make table ordering and day-to-day service easier for cafés and restaurants. Guests open a digital menu from a QR code, place an order, and contact the service team without installing an app. Teams manage orders and core operations from a responsive workspace.

![Product stage](https://img.shields.io/badge/stage-MVP%20validation-f59e0b?style=flat-square)
![Market](https://img.shields.io/badge/market-Saudi%20Arabia-0b6e4f?style=flat-square)
![Category](https://img.shields.io/badge/category-Hospitality%20Tech-2563eb?style=flat-square)
![License](https://img.shields.io/badge/license-Proprietary-111827?style=flat-square)

## Overview

SERVIO connects the guest experience with the work happening behind the counter. It is designed around a simple journey: guests browse and order from their table, staff receive and manage requests, and managers get a clearer view of daily operations.

The product is currently an MVP in market-validation. Its focus is on practical workflows for hospitality businesses in Saudi Arabia, with an Arabic-first interface and support for right-to-left layouts.

## Product capabilities

### For guests

- Open a table-specific digital menu from a QR code.
- Browse categories, search items, and view item details and recommendations.
- Place an order and follow its progress.
- Request service and share feedback.
- Use the experience in a browser without downloading an app.

### For teams

- Give managers and cashiers role-appropriate workspaces.
- Receive and progress orders through the service workflow.
- Use a cashier point of sale and record payment details.
- Manage menu items, prices, recommendations, and ingredient availability.
- Review shifts, sales summaries, reports, and customer feedback.
- Prepare customer receipts and kitchen tickets.

## How it works

```text
Guest scans a table QR
        ↓
Browses the menu and places an order
        ↓
The team receives and manages the request
        ↓
Managers review operations and feedback
```

## Technology

- **Web application:** React, React Router, and Material UI.
- **Backend services:** Supabase.
- **Hosting:** Vercel.
- **Experience:** responsive layouts, Arabic-first copy, and right-to-left support.

## Run locally

### Requirements

- Node.js 18 or newer.
- npm.
- Access to a Supabase development project for features that need backend data.

### Setup

```bash
git clone https://github.com/Tappo-Tech/servio-v01.git
cd servio-v01
npm ci
cp .env.example .env
npm start
```

Add your own local development configuration using the guidance in `.env.example`. Keep credentials and customer information out of source control. The development server runs at `http://localhost:3000`.

### Useful commands

```bash
npm start       # Start the local development server
npm test        # Run the test suite
npm run build   # Create an optimized production build
```

## Project layout

```text
src/                  Application pages, reusable UI, state, and helpers
supabase/             Database migrations and backend functions
public/               Static assets used by the web application
```

## Contributing

1. Create a focused branch for your change.
2. Keep the guest and staff experiences responsive and accessible.
3. Add or update tests for behavior that changes.
4. Run the test suite and production build before opening a pull request.
5. Do not commit credentials, private keys, or customer data.

## License

SERVIO is proprietary software. All rights are reserved. No license to copy, modify, distribute, or use the software is granted without written permission from its authorized owners.

## Contact

- Product: [servio-mvp.vercel.app](https://servio-mvp.vercel.app/)
- Company: [LinkedIn](https://www.linkedin.com/company/servio-tech) · [X](https://x.com/Servio_Tech)
- General enquiries: [servio.app.sa@gmail.com](mailto:serviotech.sa@gmail.com)
