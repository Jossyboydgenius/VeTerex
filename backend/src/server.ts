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

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
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
