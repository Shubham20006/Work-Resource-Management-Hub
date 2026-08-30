# Work & Resource Management Hub

A modern **Work & Resource Management Hub** built with React + TypeScript + Vite + Tailwind CSS + Lucide + React Router + TanStack Query, backed by a production-ready standalone **Node.js + Express + MongoDB** REST API ready for **Render** deployment.

---

## 📁 Project Architecture

```text
sheet_manager/
 ├── server/                     # Standalone Backend (Deploy on Render)
 │    ├── src/
 │    │    ├── config/db.ts      # Mongoose MongoDB connection
 │    │    ├── models/Card.ts    # Card -> Item -> Resource schemas
 │    │    ├── controllers/      # REST API controllers
 │    │    ├── routes/           # Express routes
 │    │    └── server.ts         # Express entry point & health check
 │    ├── render.yaml            # Render Blueprint deployment specification
 │    ├── .env.example           # Backend environment template
 │    └── package.json
 ├── src/                        # Frontend Application
 │    ├── components/            # UI Primitives & Layout
 │    ├── features/              # Dashboard, Workspace, Search
 │    ├── services/              # API Client & Storage layer
 │    └── types/                 # TypeScript interfaces
 └── package.json
```

---

## ⚡ Quick Start

### 1. Start the Backend Server
```bash
cd server
npm install
# Edit server/.env and add your MONGODB_URI
npm run dev
```

### 2. Start the Frontend App
```bash
# In the root folder
npm install
npm run dev
```

The frontend will run at `http://localhost:5173` and the backend will run at `http://localhost:5000`.

---

## ☁️ Deploying to Render

1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/):
   - Click **New +** -> **Web Service**
   - Connect your GitHub repository
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - In **Environment Variables**, add:
     - `MONGODB_URI` = `<your-mongodb-connection-string>`
     - `CLIENT_URL` = `https://your-frontend-url.onrender.com`
     - `NODE_ENV` = `production`
3. Click **Create Web Service**.
