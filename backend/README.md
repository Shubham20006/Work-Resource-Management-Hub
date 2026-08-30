# WorkHub Backend API (Node.js + Express + MongoDB)

Production REST API for the **Work & Resource Management Hub**, architected for standalone deployment on **Render**.

---

## 🛠️ Stack

- **Node.js** & **Express**
- **TypeScript**
- **MongoDB** with **Mongoose**
- **CORS**, **Helmet**, **Morgan**

---

## 🚀 Local Development

### 1. Configure `.env`
Create or edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/sheet_manager?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 2. Install & Run
```bash
cd server
npm install
npm run dev
```

The API will start at `http://localhost:5000`.

### 3. Seed Demo Data (Optional)
To seed initial demo workspaces (BL Projects, 3rd Year 2026, Mini Projects, CFP, etc.):
```bash
npm run seed
```
Or trigger via HTTP:
```bash
POST http://localhost:5000/api/seed
```

---

## ☁️ Deploying on Render

### Method A: Connect Repository & Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Set the following settings:
   - **Name**: `workhub-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. In **Environment Variables**, add:
   - `MONGODB_URI` = `<your-mongodb-atlas-connection-string>`
   - `NODE_ENV` = `production`
   - `CLIENT_URL` = `https://<your-frontend-domain>.onrender.com,http://localhost:5173`
5. Click **Create Web Service**.

### Method B: Render Blueprint (render.yaml)
If using Render Blueprints, Render will automatically detect the `server/render.yaml` configuration.

---

## 📡 API Reference

### Health Check
- `GET /api/health` — Returns `{ status: "ok" }` (used by Render health checks)

### Workspaces / Cards
- `GET /api/cards` — List all workspaces with nested items & resources
- `GET /api/cards/:id` — Get single workspace
- `POST /api/cards` — Create new workspace
- `PUT /api/cards/:id` — Update workspace details
- `DELETE /api/cards/:id` — Delete workspace
- `POST /api/cards/:id/duplicate` — Duplicate workspace with all items & resources
- `PATCH /api/cards/:id/favorite` — Toggle workspace favorite
- `PUT /api/cards/reorder` — Reorder workspaces (body: `{ orderedIds: string[] }`)

### Items / Sub-Projects
- `POST /api/cards/:cardId/items` — Add sub-project
- `PUT /api/cards/:cardId/items/:itemId` — Update sub-project
- `DELETE /api/cards/:cardId/items/:itemId` — Delete sub-project

### Resources / Links
- `POST /api/cards/:cardId/items/:itemId/resources` — Add resource (Google Sheet, Doc, Repo, URL)
- `PUT /api/cards/:cardId/items/:itemId/resources/:resourceId` — Update resource
- `DELETE /api/cards/:cardId/items/:itemId/resources/:resourceId` — Delete resource
- `POST /api/resources/:resourceId/open` — Record resource opened timestamp

### Stats & Seeds
- `GET /api/stats` — Overall counts (workspaces, sub-projects, links, favorites)
- `POST /api/seed` — Reset and seed database with standard initial datasets
