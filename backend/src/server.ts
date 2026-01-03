import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import userRoutes from "./routes/userRoutes.js";

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// ========== MIDDLEWARE ==========

// CORS configuration - support multiple origins for frontend and Chrome extension
const allowedOrigins = [
  process.env.CORS_ORIGIN || "http://localhost:5173",
  "https://veterex.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Chrome extensions)
      if (!origin) return callback(null, true);

      // Allow chrome-extension:// URLs
      if (origin.startsWith("chrome-extension://")) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow all localhost origins
      if (
        process.env.NODE_ENV === "development" &&
        origin.includes("localhost")
      ) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);

// Parse JSON bodies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// File upload middleware
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    // Allow images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

// Request logging in development
if (process.env.NODE_ENV === "development") {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ========== ROUTES ==========

// Favicon - VeTerex icon
app.get("/favicon.ico", (req: Request, res: Response) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
    <defs>
        <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FF6D75;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#9C86FF;stop-opacity:1" />
        </linearGradient>
    </defs>
    <rect width="128" height="128" rx="28" fill="url(#bg-gradient)"/>
    <path d="M64 20L84 50H44L64 20Z" fill="white" opacity="0.95"/>
    <path d="M44 50H84L64 108L44 50Z" fill="white" opacity="0.9"/>
    <circle cx="64" cy="58" r="10" fill="url(#bg-gradient)" opacity="0.6"/>
</svg>`;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day
  res.send(svg);
});

// Apply multer middleware to user routes
app.use("/api/user", upload.single("file"), userRoutes);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Root route - HTML landing page
app.get("/", (req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VeTerex Backend API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Outfit', sans-serif;
      background: linear-gradient(109.28deg, #1D212B 12.96%, #292347 87.04%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow-x: hidden;
    }
    .container {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      backdrop-filter: blur(10px);
      padding: 40px;
      max-width: 800px;
      width: 100%;
      position: relative;
      z-index: 1;
    }
    h1 {
      background: linear-gradient(139.84deg, #FF6D75 50%, #9C86FF 96.42%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-size: 2.5em;
      margin-bottom: 10px;
      text-align: center;
      font-weight: 700;
    }
    .subtitle {
      color: rgba(255, 255, 255, 0.7);
      text-align: center;
      margin-bottom: 30px;
      font-size: 1.1em;
      font-weight: 300;
    }
    .status {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      display: inline-block;
      font-weight: 600;
      margin-bottom: 30px;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    .section {
      margin: 30px 0;
    }
    .section h2 {
      color: #FF6D75;
      font-size: 1.5em;
      margin-bottom: 15px;
      border-bottom: 2px solid #FF6D75;
      padding-bottom: 8px;
      font-weight: 600;
    }
    .endpoint {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid #FF6D75;
      padding: 12px 16px;
      border-radius: 8px;
      margin: 8px 0;
      font-family: 'Courier New', monospace;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s ease;
    }
    .endpoint:hover {
      background: rgba(255, 109, 117, 0.1);
      transform: translateX(5px);
    }
    .endpoint .method {
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: 600;
      margin-right: 10px;
    }
    .endpoint .method.get {
      background: linear-gradient(135deg, #FF6D75 0%, #F72349 100%);
    }
    .endpoint .method.post {
      background: linear-gradient(135deg, #9C86FF 0%, #7C60FD 100%);
    }
    .endpoint .path {
      color: rgba(255, 255, 255, 0.9);
    }
    .endpoint .description {
      color: rgba(255, 255, 255, 0.6);
    }
    .service-item {
      background: rgba(156, 134, 255, 0.1);
      border-left: 4px solid #9C86FF;
      padding: 10px 16px;
      margin: 8px 0;
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.9);
    }
    .service-item strong {
      color: #9C86FF;
    }
    .docs-link {
      display: inline-block;
      background: linear-gradient(139.84deg, #FF6D75 50%, #9C86FF 96.42%);
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      margin-top: 20px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(255, 109, 117, 0.3);
    }
    .docs-link:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 109, 117, 0.4);
    }
    .footer {
      text-align: center;
      color: rgba(255, 255, 255, 0.5);
      margin-top: 40px;
      font-size: 0.9em;
    }
    .timestamp {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9em;
      text-align: center;
      margin-top: 20px;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }
    .rocket {
      font-size: 3em;
      position: absolute;
      top: 20px;
      right: 20px;
      animation: float 3s ease-in-out infinite;
      opacity: 0.3;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="rocket">🚀</div>
    <h1>VeTerex Backend API</h1>
    <p class="subtitle">Media Achievement Tracking Platform</p>
    <div style="text-align: center;">
      <span class="status">✓ Running v1.0.0</span>
    </div>
    
    <div class="section">
      <h2>📡 API Endpoints</h2>
      <div class="endpoint">
        <span><span class="method get">GET</span><span class="path">/health</span></span>
        <span class="description">Health check</span>
      </div>
      <div class="endpoint">
        <span><span class="method get">GET</span><span class="path">/api/user/profile/:authMethod/:authId</span></span>
        <span class="description">Get user profile</span>
      </div>
      <div class="endpoint">
        <span><span class="method post">POST</span><span class="path">/api/user/profile</span></span>
        <span class="description">Create/update profile</span>
      </div>
      <div class="endpoint">
        <span><span class="method post">POST</span><span class="path">/api/user/upload-image/:userId</span></span>
        <span class="description">Upload profile image</span>
      </div>
    </div>

    <div class="section">
      <h2>⚙️ Services</h2>
      <div class="service-item">
        <strong>Database:</strong> PostgreSQL (Supabase)
      </div>
      <div class="service-item">
        <strong>Storage:</strong> Supabase Storage
      </div>
      <div class="service-item">
        <strong>Authentication:</strong> VeryChat, Wepin
      </div>
    </div>

    <div style="text-align: center;">
      <a href="https://veterex.gitbook.io/veterex-docs/" class="docs-link" target="_blank">
        📚 View Documentation
      </a>
    </div>

    <p class="timestamp">Server Time: ${new Date().toISOString()}</p>
    <p class="footer">Built with Express.js, Prisma & TypeScript</p>
  </div>
</body>
</html>
  `;
  res.send(html);
});

// API info
app.get("/api", (req: Request, res: Response) => {
  res.json({
    name: "VeTerex API",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      user: {
        createOrUpdate: "POST /api/user/profile",
        get: "GET /api/user/profile/:authMethod/:authId",
        update: "PUT /api/user/profile/:userId",
        delete: "DELETE /api/user/profile/:userId",
        uploadImage: "POST /api/user/upload-image/:userId",
        deleteImage: "DELETE /api/user/profile-image/:userId",
        media: "GET /api/user/media/:userId",
        createWallet: "POST /api/user/wallet",
        getWallets: "GET /api/user/wallets/:userId",
        updateBalance: "PUT /api/user/wallet/:walletAddress/balance",
        recordTransaction: "POST /api/user/transaction",
        getTransactions: "GET /api/user/transactions/:userId",
        getTransaction: "GET /api/user/transaction/:txHash",
      },
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
  });
});

// ========== ERROR HANDLING ==========

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Server error:", err);

  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "File too large. Max size is 50MB." });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }

  // Custom errors
  if (err.message) {
    res.status(400).json({ error: err.message });
    return;
  }

  // Generic error
  res.status(500).json({
    error: "Internal server error",
  });
});

// ========== START SERVER ==========

app.listen(PORT, () => {
  console.log(`
🚀 VeTerex Backend Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 URL:         http://localhost:${PORT}
🌐 Environment: ${process.env.NODE_ENV || "development"}
📊 Health:      http://localhost:${PORT}/health
📚 API Info:    http://localhost:${PORT}/api
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

export default app;
