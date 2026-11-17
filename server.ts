import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = process.env.DATA_PATH || path.join(process.cwd(), 'user_data.json');
const ADMIN_SECRET = process.env.ADMIN_SECRET || crypto.randomBytes(32).toString('hex');

// Password Hashing & Verification (scrypt + constant-time comparison)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  // Backward compatibility: support legacy plaintext passwords during upgrade
  if (!stored.includes(':')) {
    return password === stored;
  }
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedBuffer = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
  } catch (err) {
    return false;
  }
}

// Admin Token Utilities (HMAC-SHA256 Signed Session Token)
function createAdminToken(): string {
  const payload = JSON.stringify({ role: 'admin', ts: Date.now() });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', ADMIN_SECRET).update(b64).digest('hex');
  return `${b64}.${sig}`;
}

function verifyAdminToken(token?: string): boolean {
  if (!token) return false;
  const [b64, sig] = token.split('.');
  if (!b64 || !sig) return false;
  try {
    const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET).update(b64).digest('hex');
    const sigBuffer = Buffer.from(sig, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');
    if (sigBuffer.length !== expectedBuffer.length) return false;
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return false;
    
    // Token validity: 7 days
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf-8'));
    if (!payload.ts || Date.now() - payload.ts > 7 * 24 * 60 * 60 * 1000) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

const readData = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { users: {}, accounts: {} };
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    if (!content.trim()) return { users: {}, accounts: {} };
    const data = JSON.parse(content);
    return {
      users: data.users || {},
      accounts: data.accounts || {}
    };
  } catch (error) {
    console.error("Error reading data file:", error);
    return { users: {}, accounts: {} };
  }
};

const writeData = (data: any) => {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempFile = `${DATA_FILE}.${crypto.randomUUID()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (error) {
    console.error("Error writing data file:", error);
  }
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check endpoint for Render
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  // Auth Routes
  app.post('/api/register', (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Missing required registration fields' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const data = readData();
    if (data.accounts[cleanUsername]) {
      return res.status(400).json({ error: 'User already exists' });
    }

    data.accounts[cleanUsername] = {
      username: cleanUsername,
      password: hashPassword(String(password)),
      email: String(email).trim().toLowerCase(),
      createdAt: new Date().toISOString()
    };
    writeData(data);
    res.json({ success: true, username: cleanUsername });
  });

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const data = readData();
    const account = data.accounts[cleanUsername];

    if (account && verifyPassword(String(password), account.password)) {
      // Auto-upgrade legacy plaintext password if necessary
      if (!account.password.includes(':')) {
        account.password = hashPassword(String(password));
        writeData(data);
      }
      res.json({ success: true, username: cleanUsername });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'Ramakrishna@2009';

    if (username === adminUser && password === adminPass) {
      const token = createAdminToken();
      res.json({ success: true, token });
    } else {
      res.status(401).json({ error: 'Invalid admin credentials' });
    }
  });

  // API Routes
  app.get('/api/progress/:username', (req, res) => {
    const username = String(req.params.username).trim().toLowerCase();
    const data = readData();
    res.json(data.users[username] || null);
  });

  app.post('/api/progress', (req, res) => {
    const { username, lastRead } = req.body;
    if (!username || !lastRead) return res.status(400).json({ error: 'Missing data' });

    const cleanUsername = String(username).trim().toLowerCase();
    const data = readData();
    const user = data.users[cleanUsername] || { username: cleanUsername, history: [] };
    
    // Update last read
    user.lastRead = lastRead;
    user.updatedAt = new Date().toISOString();
    
    // Update history (avoid duplicates and keep last 20)
    const historyItem = { ...lastRead, timestamp: user.updatedAt };
    const history = user.history || [];
    
    // Check if the last item in history is the same verse
    const lastHistoryItem = history[0];
    const isSameVerse = lastHistoryItem && 
                       lastHistoryItem.scriptureId === lastRead.scriptureId && 
                       lastHistoryItem.section === lastRead.section && 
                       lastHistoryItem.verse === lastRead.verse;

    if (!isSameVerse) {
      user.history = [historyItem, ...history].slice(0, 20);
    }

    data.users[cleanUsername] = user;
    writeData(data);
    res.json({ success: true });
  });

  // Protected Admin endpoint — requires admin Bearer token
  app.get('/api/admin/users', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.query.token as string);

    if (!verifyAdminToken(token)) {
      return res.status(401).json({ error: 'Unauthorized: Valid admin token required' });
    }

    const data = readData();
    res.json(Object.values(data.users));
  });

  // TTS endpoint — generates audio using espeak-ng deep male Hindi voice
  app.get('/api/tts', async (req, res) => {
    const text = (req.query.text as string) || '';
    if (!text.trim()) return res.status(400).send('No text provided');

    // Cap text to 500 characters to prevent resource exhaustion
    const safeText = text.trim().slice(0, 500);

    const { execFile } = await import('child_process');
    const os = await import('os');
    const tmpWav = path.join(os.tmpdir(), `veda_tts_${crypto.randomUUID()}.wav`);

    // Deep male Hindi voice: slow speed (80), low pitch (30), word gap (9)
    // Run directly via execFile without spawning a shell (immune to command injection)
    const args = ['-v', 'hi', '-s', '80', '-p', '30', '-g', '9', '-a', '200', safeText, '-w', tmpWav];

    execFile('espeak-ng', args, (err) => {
      if (err) {
        console.error('espeak-ng execution error:', err.message);
        return res.status(500).send('TTS generation failed');
      }

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      const stream = fs.createReadStream(tmpWav);
      stream.pipe(res);

      const cleanup = () => {
        try {
          if (fs.existsSync(tmpWav)) fs.unlinkSync(tmpWav);
        } catch (_) {}
      };

      stream.on('end', cleanup);
      stream.on('close', cleanup);
      stream.on('error', (streamErr) => {
        console.error('Audio stream error:', streamErr);
        cleanup();
        if (!res.headersSent) res.status(500).send('Stream error');
      });
    });
  });

  // Vite middleware for development vs static serving for production
  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        if (e instanceof Error) vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Veda Darshan server running on http://0.0.0.0:${PORT}`);
    console.log('Scripture data loaded locally — ready for requests.');
  });
}

startServer();