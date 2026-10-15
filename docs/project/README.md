# Forever E-commerce Platform

A complete e-commerce platform with dynamic product measurements, advanced admin dashboard, and premium Bihar-inspired design.

## 📚 Documentation

All documentation has been reorganized for better discoverability:

- **[Architecture](../architecture/)** - System architecture, dependencies, and API documentation
- **[Development](../development/)** - Development setup, workflow, and guidelines  
- **[Features](../features/)** - Feature-specific documentation and guides
- **[Deployment](../deployment/)** - Deployment guides and configurations
- **[Security](../security/)** - Security implementation and audit reports
- **[Reports](../reports/)** - Analysis reports and change logs

## Project Structure

- `frontend/` - React frontend application with dynamic measurements
- `backend/` - Node.js/Express backend API with enhanced product model
- `admin/` - React admin panel with advanced product management
- `docs/` - Centralized documentation hub

## Quick Start

### Option 1: Using npm scripts (Recommended)

```bash
# Install all dependencies
npm run install:all

# Start all applications
npm run dev
```

### Option 2: Using shell script

```bash
# Make script executable (if not already)
chmod +x start-all.sh

# Start all applications
./start-all.sh
```

### Option 3: Manual start

```bash
# Terminal 1 - Backend
cd backend && npm run server

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - Admin
cd admin && npm run dev
```

## Available Scripts

- `npm run dev` - Start all applications concurrently
- `npm run dev:frontend` - Start only frontend
- `npm run dev:backend` - Start only backend
- `npm run dev:admin` - Start only admin panel
- `npm run install:all` - Install dependencies for all projects
- `npm run build` - Build frontend and admin applications
- `npm start` - Start backend in production mode

## Application URLs

- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:5173
- **Admin Panel**: http://localhost:5174

## Key Features

- **Dynamic Product Measurements**: Weight, size, volume, quantity, and length options with individual pricing
- **Advanced Admin Dashboard**: Visual measurement management with custom categories
- **Premium Color Palette**: Bihar-inspired design with traditional colors
- **Enhanced Search**: Universal search with real-time filtering
- **Performance Optimized**: 20x faster loading with instant data display
- **Mobile Responsive**: Optimized for all device sizes

## Dependencies

All required packages have been installed for:
- Frontend (React + Vite + TailwindCSS + Dynamic Measurements)
- Backend (Node.js + Express + MongoDB + Enhanced Product Model)
- Admin Panel (React + Vite + TailwindCSS + Advanced Management UI)

## Need Help?

- **Setup Issues**: See [Development Guide](../development/DEVELOPMENT.md) for detailed setup instructions
- **Feature Documentation**: Check [Project Guide](./PROJECT_GUIDE.md) for comprehensive feature guide
- **System Architecture**: Review [Dependency Map](../architecture/DEPENDENCY_MAP.md) for system connections
- **Version Changes**: Check [Change Log](../reports/CHANGELOG.md) for update information

## Stopping Applications

- If using npm scripts: Press `Ctrl+C` in the terminal
- If using shell script: Press `Ctrl+C` to stop all applications
- If running manually: Stop each terminal with `Ctrl+C`

---

*Documentation restructured on 2025-01-13 for better organization. See [docs/README.md](../README.md) for navigation guide.*