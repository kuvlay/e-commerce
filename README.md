# E-Commerce Platform

A collaborative full-stack shopping application with separate customer and administrator interfaces backed by an Express API. The repository covers the journey from browsing products to managing orders, alongside authentication, product reviews, and store administration.

**React · Vite · Tailwind CSS · Node.js · Express · MongoDB**

[Portfolio](https://github.com/kuvlay)

## Application areas

| Area | Implementation in the source |
| --- | --- |
| Customer storefront | Product browsing, cart, wishlist, checkout pages, order tracking, profile and address screens |
| Admin dashboard | Product management, orders, customers, reviews, messages, and dashboard views |
| Authentication | JWT-based sessions, password handling, email verification flows, and Google sign-in integration |
| Services | MongoDB persistence, Cloudinary images, email delivery, and Razorpay integration |

External integrations require your own accounts and configuration. Their presence in the source is not a claim that live payments, email delivery, or every user flow has been validated in this copy.

## Structure

```text
frontend/   Customer-facing React application
admin/      Administrator React application
backend/    Express API and domain modules
docs/       Architecture, setup and troubleshooting notes
```

## Run locally

Requirements: Node.js, npm, a MongoDB database, and the service configuration used by the backend.

```bash
git clone https://github.com/kuvlay/e-commerce.git
cd e-commerce
npm run install:all
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp admin/.env.example admin/.env.local
```

Fill in your own values before starting the application. Backend startup validates `MONGODB_URI`, `JWT_SECRET`, and the three Cloudinary settings. Configure email, Google sign-in, payment, and other provider keys only for features you intend to use; replace example administrator credentials with your own local configuration.

For a consistent local setup, use:

| Configuration | Value |
| --- | --- |
| Backend `PORT` | `5000` |
| Backend `FRONTEND_URL` | `http://localhost:5173` |
| Backend `ADMIN_URL` | `http://localhost:5175` |
| Frontend and admin `VITE_BACKEND_URL` | `http://localhost:5000` |

The backend code defaults to port 4000 when `PORT` is absent; the environment example uses 5000. Keep the client URLs aligned with your chosen backend port.

```bash
npm run dev
```

The root command starts all three services. The frontend uses port 5173 and the admin app uses 5175 by default. `npm run build` builds both React applications; `npm start` runs the backend.

## Verification and status

The repository contains Vitest tests in the application directories. A fresh dependency install, build, and end-to-end test run were not performed for this documentation update. The backend npm test script uses Windows-style environment assignment, so other shells may need an equivalent command. Several inherited root utility scripts refer to files not present in the source; inspect the specific script before relying on it.

This remains a development portfolio project with external service dependencies, not a claim of a production-operated store or measured business results.

<details>
<summary>Credits and project history</summary>

Source lineage: [aarish-io/e-commerce](https://github.com/aarish-io/e-commerce). The source history records contributions from Aarish and Aftab / `aftab-ansari2005`; this is collaborative work. The clean copy preserves contributor details in [PROVENANCE.md](PROVENANCE.md) and excludes credential-bearing history and IDE records.

The original README described this as an educational project, and several package manifests declare ISC. Those declarations are retained; no new license or sole-author claim is made.

</details>
