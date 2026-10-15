# E-Commerce Platform

A full-stack e-commerce application with separate customer frontend, admin dashboard, and backend API.

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Axios
**Admin:** React, Vite, Tailwind CSS
**Backend:** Node.js, Express, MongoDB, JWT, Nodemailer
**Deployment:** Vercel (frontend/admin), Render (backend)

## Project Structure

```
├── frontend/     # Customer-facing application
├── backend/      # REST API server
├── admin/        # Admin dashboard
└── package.json  # Root scripts
```

## Quick Start

### Install all dependencies:
```bash
npm install
```

### Setup environment variables:
Create `.env` files in `backend/`, `frontend/`, and `admin/` with required configs.

### Run all services:
```bash
npm run dev
```

This starts frontend (port 5173), backend (port 5000), and admin (port 5175) concurrently.

## Features

- User authentication with email verification
- Product catalog with search and filters
- Shopping cart and wishlist
- Order management
- Admin dashboard for products, orders, and users
- Responsive design

## License

Educational project.


## Provenance

Clean portfolio copy of [aarish-io/e-commerce](https://github.com/aarish-io/e-commerce), imported at the source owner's request. Original contributors include Aarish and Aftab; see [PROVENANCE.md](PROVENANCE.md). Credential-bearing configuration and IDE artifacts are excluded, and database URLs in documentation use placeholders. The original educational-project license statement above is retained; no additional license is granted.
