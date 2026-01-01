import { Request, Response, NextFunction } from "express";

const PROJECT_ID = process.env.VERYAPI_PROJECT_ID!;
const VERYAPI_BASE = "https://gapi.veryapi.io/auth";

// Response type from VeryChat API
interface VeryChatValidateResponse {
  data?: {
    valid: boolean;
    payload?: {
      profileId: string;
      profileName: string;
    };
  };
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        authId: string;
        authMethod: "verychat" | "wepin";
        profileName?: string;
      };
    }
  }
}

/**
 * Middleware to verify VeryChat token
 */
export async function verifyVeryChatToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    // Validate with VeryChat API
    const response = await fetch(`${VERYAPI_BASE}/validate-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ projectId: PROJECT_ID }),
    });

    const data = (await response.json()) as VeryChatValidateResponse;

    if (data.data?.valid && data.data.payload) {
      req.user = {
        userId: data.data.payload.profileId,
        authId: data.data.payload.profileId,
        authMethod: "verychat",
        profileName: data.data.payload.profileName,
      };
      next();
    } else {
      res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error("❌ Token validation error:", error);
    res.status(401).json({ error: "Token validation failed" });
  }
}

/**
 * Middleware for optional authentication (allows unauthenticated requests)
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      next();
      return;
    }

    // Try to validate
    const response = await fetch(`${VERYAPI_BASE}/validate-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ projectId: PROJECT_ID }),
    });

    const data = (await response.json()) as VeryChatValidateResponse;

    if (data.data?.valid && data.data.payload) {
      req.user = {
        userId: data.data.payload.profileId,
        authId: data.data.payload.profileId,
        authMethod: "verychat",
        profileName: data.data.payload.profileName,
      };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

/**
 * Simple API key authentication for internal services
 */
export function verifyApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers["x-api-key"];
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!expectedKey || apiKey === expectedKey) {
    next();
  } else {
    res.status(401).json({ error: "Invalid API key" });
  }
}
