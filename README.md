# 🚀 Work & Resource Management Hub

A modern, high-performance **Work & Resource Management Hub** built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, **TanStack Query**, and **Lucide Icons**, backed by a production-ready **Node.js + Express + MongoDB (Mongoose)** REST API designed for cloud deployment on platforms like **Render**.

---

## ✨ Features

- 📂 **Workspaces & Board Management**: Organize workspaces, cards, sub-groups, and resource items into structured hierarchies.
- 🎯 **Resource Tracking & Categorization**: Track links, project assets, documentation, and tools with color coding and custom metadata.
- 🔍 **Global Command Palette & Search**: Quick search and quick-switch capabilities across all workspace resources.
- 📊 **Dashboard & Analytics**: Visual statistics and summary metrics for cards, active resources, and project hubs.
- 🎨 **Modern & Adaptive UI**: Theme system supporting dark and light mode, interactive modals, drag-and-drop / placement updates, and intuitive UI components.
- 🛠️ **Data Import & Seeding Utility**: Pre-configured seeds and Google Sheets data import CLI tools.

---

## 📁 Project Architecture

```text
Work-Resource-Management-Hub/
 ├── backend/                        # Express + MongoDB REST API Service
 │    ├── src/
 │    │    ├── config/db.ts         # Mongoose MongoDB Connection Setup
 │    │    ├── models/Card.ts       # Mongoose Schemas (Card -> Item -> Resource)
 │    │    ├── controllers/         # REST API Controllers (Cards, Items, Resources, Stats)
 │    │    ├── routes/              # Express API Routes
 │    │    ├── seeds/               # Database Seeding & Google Sheet Importer Scripts
 │    │    └── server.ts            # Main Express Server Entrypoint
 │    ├── render.yaml               # Render Cloud Deployment Blueprint
 │    ├── tsconfig.json             # Backend TypeScript Configuration
 │    └── package.json              # Backend Dependencies & Scripts
 │
 ├── frontend/                       # React + Vite Client Application
 │    ├── src/
 │    │    ├── components/          # UI Primitives (Button, Modal, Badge, ColorPicker, etc.) & Layout
 │    │    ├── context/             # Theme & Global State Providers
 │    │    ├── features/            # Feature modules (Dashboard, Projects, Workspace, Search, Sheets)
 │    │    ├── hooks/               # Custom React Hooks (useCards, useWorkspace, useTheme)
 │    │    ├── services/            # API Client Axios/Fetch Service Layer
 │    │    ├── types/               # TypeScript Definitions
 │    │    ├── utils/               # Helper utilities (cn, styling helpers)
 │    │    └── App.tsx              # Root React Router Component
 │    ├── vite.config.ts            # Vite Configuration
 │    ├── tailwind.config.js        # Tailwind CSS Configuration
 │    └── package.json              # Frontend Dependencies & Scripts
 │
 └── README.md                       # Project Documentation
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4, PostCSS, Autoprefixer
- **State & Data Fetching**: TanStack React Query v5
- **Routing**: React Router v7
- **Forms & Validation**: React Hook Form + Zod
- **Icons & Feedback**: Lucide React, Sonner (Toasts)

### Backend
- **Runtime & Server**: Node.js, Express.js
- **Language**: TypeScript (`tsx` for live execution)
- **Database**: MongoDB via Mongoose ORM
- **Security & Logging**: Helmet, CORS, Morgan, Dotenv, Zod

---

## ⚡ Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas Connection String)

---

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in `backend/` (or update existing environment variables):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/workhub
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

4. *(Optional)* Seed initial sample workspace data into MongoDB:
   ```bash
   npm run seed
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will run at `http://localhost:5000`. You can test service health at `http://localhost:5000/api/health`.

---

### 2. Frontend Setup

1. Open a new terminal window and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Access the web application in your browser at `http://localhost:5173`.

---

## 🗄️ Database CLI Utilities

The backend includes CLI commands for database maintenance and seeding:

| Script | Command | Description |
| :--- | :--- | :--- |
| **Seed Data** | `npm run seed` | Seeds initial workspace cards, items, and resources into MongoDB. |
| **Clear Data** | `npm run clear` | Clears all existing cards and resources from the database. |
| **Import Sheet** | `npm run import-sheet` | Runs the Google Sheet data importer script. |

---

## 🔌 API Endpoints Summary

- **Health Check**: `GET /api/health`
- **Dashboard Stats**: `GET /api/stats`
- **Cards (Workspaces)**:
  - `GET /api/cards`
  - `POST /api/cards`
  - `GET /api/cards/:id`
  - `PUT /api/cards/:id`
  - `DELETE /api/cards/:id`
- **Items & Subgroups**:
  - `POST /api/cards/:cardId/items`
  - `PUT /api/cards/:cardId/items/:itemId`
  - `DELETE /api/cards/:cardId/items/:itemId`
- **Resources**:
  - `POST /api/cards/:cardId/items/:itemId/resources`
  - `PUT /api/cards/:cardId/items/:itemId/resources/:resourceId`
  - `DELETE /api/cards/:cardId/items/:itemId/resources/:resourceId`

---

## ☁️ Deployment Guide

### Deploying Backend to Render

1. Push your repository to GitHub.
2. Log into the [Render Dashboard](https://dashboard.render.com/) and create a **Web Service**.
3. Connect your repository and configure the following settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Set the following **Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas URI
   - `CLIENT_URL`: `https://your-frontend-domain.com`
   - `NODE_ENV`: `production`

---

## 📄 License

This project is licensed under the ISC License.
