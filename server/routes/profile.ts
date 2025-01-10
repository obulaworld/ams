import express from "express";
import { z } from "zod";

const router = express.Router();

// In-memory storage for profile data
const profiles: Record<string, any> = {};

// Profile schema validation
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  notificationPreferences: z
    .object({
      email: z.boolean(),
      sms: z.boolean(),
      reminders: z.boolean(),
    })
    .optional(),
  // Organization-specific fields
  description: z.string().max(500).optional(),
  address: z.string().optional(),
});

// Get profile
router.get("/", (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const profile = profiles[req.user.id] || {
      name: req.user.name,
      email: req.user.email,
      notificationPreferences: {
        email: true,
        sms: false,
        reminders: true,
      },
    };

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Update profile
router.put("/", async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validatedData = profileSchema.parse(req.body);
    profiles[req.user.id] = {
      ...profiles[req.user.id],
      ...validatedData,
    };

    res.json(profiles[req.user.id]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update profile" });
  }
});

export { router };
