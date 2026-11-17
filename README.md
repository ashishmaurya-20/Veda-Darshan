# Veda Darshan — Scripture Reader & Audio Player

A full-stack application for reading, listening to, and tracking progress across ancient scriptures including the Bhagavad Gita, Rigveda, Samaveda, Yajurveda, Atharvaveda, and the major Upanishads.

---

## Features
- **Scripture Exploration**: Section and verse navigation across 14+ foundational texts.
- **Audio Recitation (TTS)**: Dual-layer Hindi audio synthesis:
  - Client-side: Browser Web Speech API (`hi-IN`).
  - Server-side fallback: Native `espeak-ng` deep male Hindi voice.
- **User Authentication & Profiles**: Registration, login, and encrypted password storage (scrypt).
- **Progress Tracking**: Automatic bookmarking of last read verse and recent reading history.
- **Admin Dashboard**: View user activity and progress statistics (accessible via `#admin`).
- **Render Ready**: Multi-stage Docker containerization with automated environment variable binding.

---

## Quick Deploy to Render

### Option 1: Via Render Blueprint (1-Click)
1. Push this project to a **GitHub** or **GitLab** repository.
2. In your [Render Dashboard](https://dashboard.render.com/):
   - Click **New +** -> **Blueprint**.
   - Connect your repository.
   - Render will detect `render.yaml` and configure the Docker Web Service, health checks, and secure environment variables automatically.
3. Click **Apply**.

---

### Option 2: Manual Web Service Setup on Render
1. Push your project to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Web Service**.
3. Select your GitHub repository.
4. Configure the settings:
   - **Name**: `veda-darshan`
   - **Language / Environment**: `Docker`
   - **Branch**: `main` (or your branch)
   - **Region**: Choose the region closest to your users.
   - **Plan**: `Free`
5. Under **Environment Variables**, add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production mode & static asset caching |
   | `ADMIN_USERNAME` | `admin` | Username for the `#admin` dashboard |
   | `ADMIN_PASSWORD` | *(your strong password)* | Password for the `#admin` dashboard |
   | `ADMIN_SECRET` | *(random 32+ character string)* | Used to sign admin session tokens |
6. Under **Advanced**:
   - Set **Health Check Path** to `/healthz`.
7. Click **Create Web Service**.

Render will automatically pull the Dockerfile, install `espeak-ng`, build the frontend and backend, and bind to Render's dynamic `$PORT`.

---

## Local Development & Testing

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or v22 recommended)
- [npm](https://www.npmjs.com/)

### Setup & Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start in development mode (with Hot Module Replacement):
   ```bash
   npm run dev
   ```
3. Open in your browser: `http://localhost:3000`

### Production Build & Test Locally
```bash
# 1. Build frontend and backend
npm run build

# 2. Run compiled production server
npm start
```

### Run with Docker Locally
```bash
# Build the Docker image
docker build -t veda-darshan .

# Run the container
docker run -p 3000:10000 -e PORT=10000 -e ADMIN_PASSWORD=adminpass veda-darshan
```

---

## Admin Dashboard Access
1. Navigate to: `http://localhost:3000/#admin` (or your Render URL + `/#admin`)
2. Log in with your configured `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
3. View user activity and progress.
"# Veda-Darshan" 
