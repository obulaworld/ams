import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { organizations, settings } from "./organizations";

const router = express.Router();

// In-memory storage
const users: any[] = [];

// Most specific route first
router.get("/validate", async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userData = users.find((u) => u.id === user.id);
    if (!userData) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Authentication routes
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    if (users.find((user) => user.email === email)) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userId = uuidv4();
    const user = {
      id: userId,
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
    };

    users.push(user);

    // If the user is an organization, initialize their data
    if (role === "organization") {
      organizations.push({
        id: userId,
        name,
        email,
        description: "",
        settings: {
          businessHours: [
            { day: "Monday", start: "09:00", end: "17:00", isOpen: true },
            { day: "Tuesday", start: "09:00", end: "17:00", isOpen: true },
            { day: "Wednesday", start: "09:00", end: "17:00", isOpen: true },
            { day: "Thursday", start: "09:00", end: "17:00", isOpen: true },
            { day: "Friday", start: "09:00", end: "17:00", isOpen: true },
            { day: "Saturday", start: "09:00", end: "13:00", isOpen: false },
            { day: "Sunday", start: "09:00", end: "13:00", isOpen: false },
          ],
          slotDuration: 30,
          breakBetweenSlots: 0,
        },
      });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export { router };
