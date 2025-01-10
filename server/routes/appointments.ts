import express from "express";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { Appointment } from "../types";

const router = express.Router();

// In-memory storage
export const appointments: Appointment[] = [];
export const bookedSlots: Record<
  string,
  {
    organizationId: string;
    appointmentId: string;
    timeSlots: {
      start: string;
      end: string;
    }[];
  }
> = {};

// Validation schemas
const filterSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "all"]).optional(),
  date: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
});

const createAppointmentSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  timeSlot: z.object({
    start: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    end: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  }),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["confirmed", "cancelled"]),
});

// Get appointments for the current user
router.get("/", (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userAppointments = appointments.filter((apt) =>
      req.user!.role === "organization"
        ? apt.organizationId === req.user!.id
        : apt.individualId === req.user!.id
    );

    res.json(userAppointments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

// Get appointment statistics (for organizations)
router.get("/stats", (req, res) => {
  try {
    if (!req.user?.id || req.user.role !== "organization") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const orgAppointments = appointments.filter(
      (apt) => apt.organizationId === req.user!.id
    );

    const stats = {
      total: orgAppointments.length,
      confirmed: orgAppointments.filter((apt) => apt.status === "confirmed")
        .length,
      cancelled: orgAppointments.filter((apt) => apt.status === "cancelled")
        .length,
      pending: orgAppointments.filter((apt) => apt.status === "pending").length,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch appointment statistics" });
  }
});

// Filter appointments
router.get("/filter", (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { status, date } = filterSchema.parse(req.query);

    let filtered = appointments.filter((apt) =>
      req.user!.role === "organization"
        ? apt.organizationId === req.user!.id
        : apt.individualId === req.user!.id
    );

    if (status && status !== "all") {
      filtered = filtered.filter((apt) => apt.status === status);
    }

    if (date) {
      filtered = filtered.filter(
        (apt) => format(apt.date, "yyyy-MM-dd") === date
      );
    }

    res.json(filtered);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid parameters", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to filter appointments" });
  }
});

// Create appointment
router.post("/", (req, res) => {
  try {
    if (!req.user?.id || req.user.role !== "individual") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validatedData = createAppointmentSchema.parse(req.body);

    // Check if slot is already booked
    const dateStr = format(new Date(validatedData.date), "yyyy-MM-dd");
    const existingBooking = bookedSlots[dateStr]?.timeSlots.find(
      (slot) =>
        slot.start === validatedData.timeSlot.start &&
        slot.end === validatedData.timeSlot.end
    );

    if (existingBooking) {
      return res
        .status(400)
        .json({ message: "This time slot is already booked" });
    }

    // Generate a unique appointment number
    const appointmentNumber = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const appointment: Appointment = {
      id: uuidv4(),
      organizationId: validatedData.organizationId,
      organizationName: "Organization Name", // This should come from your organizations data
      individualId: req.user.id,
      individualName: req.user.name,
      date: new Date(validatedData.date),
      timeSlot: validatedData.timeSlot,
      status: "pending",
      notes: validatedData.notes,
      number: appointmentNumber,
      createdAt: new Date(),
    };

    // Store the appointment
    appointments.push(appointment);

    // Store booked slot
    if (!bookedSlots[dateStr]) {
      bookedSlots[dateStr] = {
        organizationId: appointment.organizationId,
        appointmentId: appointment.id,
        timeSlots: [],
      };
    }

    bookedSlots[dateStr].timeSlots.push({
      start: appointment.timeSlot.start,
      end: appointment.timeSlot.end,
    });

    res.status(201).json(appointment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create appointment" });
  }
});


// Get appointment by ID
router.get("/:id", (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const appointment = appointments.find(
      (apt) =>
        apt.id === req.params.id &&
        (req.user!.role === "organization"
          ? apt.organizationId === req.user!.id
          : apt.individualId === req.user!.id)
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch appointment" });
  }
});

// Update appointment status
router.patch("/:id/status", (req, res) => {
  try {
    if (!req.user?.id || req.user.role !== "organization") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { status } = updateStatusSchema.parse(req.body);

    const appointment = appointments.find(
      (apt) => apt.id === id && apt.organizationId === req.user!.id
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = status;

    // If cancelled, remove the booked slot
    if (status === "cancelled") {
      const dateStr = format(appointment.date, "yyyy-MM-dd");
      if (bookedSlots[dateStr]) {
        bookedSlots[dateStr].timeSlots = bookedSlots[dateStr].timeSlots.filter(
          (slot) => slot.start !== appointment.timeSlot.start
        );

        // Clean up if no more slots for that date
        if (bookedSlots[dateStr].timeSlots.length === 0) {
          delete bookedSlots[dateStr];
        }
      }
    }

    res.json(appointment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid status", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update appointment status" });
  }
});

// Cancel appointment (for individuals)
router.post("/:id/cancel", (req, res) => {
  try {
    if (!req.user?.id || req.user.role !== "individual") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const appointment = appointments.find(
      (apt) => apt.id === id && apt.individualId === req.user!.id
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Appointment is already cancelled" });
    }

    appointment.status = "cancelled";

    // Remove booked slot
    const dateStr = format(appointment.date, "yyyy-MM-dd");
    if (bookedSlots[dateStr]) {
      bookedSlots[dateStr].timeSlots = bookedSlots[dateStr].timeSlots.filter(
        (slot) => slot.start !== appointment.timeSlot.start
      );

      // Clean up if no more slots for that date
      if (bookedSlots[dateStr].timeSlots.length === 0) {
        delete bookedSlots[dateStr];
      }
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel appointment" });
  }
});

export { router };
