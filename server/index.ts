import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { router as authRouter } from "./routes/auth";
import { router as appointmentsRouter } from "./routes/appointments";
import { router as organizationsRouter } from "./routes/organizations";
import { router as profileRouter } from "./routes/profile";

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:5173", // Vite's default port
    credentials: true,
  })
);

// Middleware
app.use(express.json());

// JWT middleware
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );
      req.user = decoded as { id: string; role: string };
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  }
  next();
});

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Appointment Management System API" });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/organizations", organizationsRouter);
app.use("/api/profile", profileRouter);

// Error handling
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
