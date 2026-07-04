import { Router, Response } from "express";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import prisma from "../db";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtdockerclonekey";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "supersecretrefreshkey";

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Username or Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        fullName,
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
      },
    });

    // Create a default notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Welcome aboard!",
        message: "Thanks for joining Docker Hub. Start by creating a repository or exploring official images.",
        type: "SUCCESS",
      },
    });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const accessToken = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.accessToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh Token
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const tokenRecord = await prisma.accessToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord || tokenRecord.revoked || new Date() > tokenRecord.expiresAt) {
      return res.status(403).json({ error: "Invalid or expired refresh token" });
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: "Invalid refresh token" });
      }

      const accessToken = jwt.sign(
        { id: decoded.id, username: decoded.username, email: decoded.email },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ accessToken });
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.accessToken.update({
        where: { token: refreshToken },
        data: { revoked: true },
      });
    }
    res.json({ message: "Logged out successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Current User (Me)
router.get("/me", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
