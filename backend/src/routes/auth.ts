import { Router, Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { signToken } from "../lib/jwt";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.enum(["user", "mechanic"]).default("user"),
});

const adminSignupSchema = signupSchema.extend({
  adminSecret: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  fullName: z.string().min(2).optional(),
  adminSecret: z.string().optional(),
});

// POST /api/auth/signup
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = signupSchema.parse(req.body);
    const exists = await User.findOne({ email: body.email });
    if (exists) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const user = await User.create(body);
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/auth/admin/signup
router.post(
  "/admin/signup",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const body = adminSignupSchema.parse(req.body);

      const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "dev-admin-secret";
      if (body.adminSecret !== ADMIN_SECRET) {
        res.status(401).json({ error: "Invalid admin secret" });
        return;
      }

      const exists = await User.findOne({ email: body.email });
      if (exists) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }

      const user = await User.create({
        email: body.email,
        password: body.password,
        fullName: body.fullName,
        role: "admin",
      });
      const token = signToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });
      res.status(201).json({
        token,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.errors });
        return;
      }
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = loginSchema.parse(req.body);
    let user = await User.findOne({ email: body.email }).select("+password");

    // If no user found, allow creating the initial admin account when there are
    // no admins in the system and the correct admin secret is supplied.
    if (!user) {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount === 0) {
        const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "dev-admin-secret";
        if (!body.adminSecret || body.adminSecret !== ADMIN_SECRET) {
          res.status(401).json({ error: "Invalid email or password" });
          return;
        }
        if (!body.fullName) {
          res
            .status(400)
            .json({ error: "fullName is required to create initial admin" });
          return;
        }
        user = await User.create({
          email: body.email,
          password: body.password,
          fullName: body.fullName,
          role: "admin",
        });
      } else {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
    } else {
      if (!(await user.comparePassword(body.password))) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
    }
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/auth/me
router.get(
  "/me",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.user!.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        mechanicId: user.mechanicId,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

// PATCH /api/auth/me
router.patch(
  "/me",
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await User.findByIdAndUpdate(
        req.user!.userId,
        {
          $set: { fullName: req.body.fullName, avatarUrl: req.body.avatarUrl },
        },
        { new: true },
      );
      res.json({
        id: user!._id,
        email: user!.email,
        fullName: user!.fullName,
        role: user!.role,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

export default router;
