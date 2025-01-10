import express from 'express';
import { format, parse, addMinutes, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval, isPast, isToday, parseISO, isSameMonth } from 'date-fns';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { bookedSlots } from "./appointments";
import { TimeSlot, BusinessHours, OrganizationSettings, Appointment } from '../types';

const router = express.Router();

// In-memory storage
export const organizations: any[] = [];
export const settings: Record<string, OrganizationSettings> = {};
export const timeSlots: Record<string, Record<string, TimeSlot[]>> = {};
export const appointments: Appointment[] = [];
export const lockedDays: Record<string, string[]> = {};

// Get analytics data
router.get('/analytics', (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { start, end } = req.query;
    if (!start || !end || typeof start !== 'string' || typeof end !== 'string') {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    const startDate = parseISO(start);
    const endDate = parseISO(end);

    // Filter appointments for this organization within date range
    const orgAppointments = appointments.filter(apt => 
      apt.organizationId === req.user!.id &&
      isWithinInterval(new Date(apt.date), { start: startDate, end: endDate })
    );

    // Calculate total appointments
    const totalAppointments = orgAppointments.length;

    // Calculate completion rate (confirmed appointments)
    const confirmedAppointments = orgAppointments.filter(apt => apt.status === 'confirmed').length;
    const completionRate = totalAppointments > 0 
      ? Math.round((confirmedAppointments / totalAppointments) * 100)
      : 0;

    // Calculate average daily appointments
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const averageDaily = totalAppointments > 0 
      ? Math.round(totalAppointments / totalDays)
      : 0;

    // Find most popular time slot
    const timeSlotCounts = orgAppointments.reduce((acc: Record<string, number>, apt) => {
      const time = format(new Date(apt.date), 'HH:mm');
      acc[time] = (acc[time] || 0) + 1;
      return acc;
    }, {});

    const popularTimeSlot = Object.entries(timeSlotCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Calculate monthly data
    const monthlyData = eachDayOfInterval({ start: startDate, end: endDate })
      .reduce((acc: { month: string; appointments: number }[], date) => {
        const monthKey = format(date, 'MMM');
        const existingMonth = acc.find(m => m.month === monthKey);
        
        if (!existingMonth) {
          const monthAppointments = orgAppointments.filter(apt => 
            isSameMonth(new Date(apt.date), date)
          ).length;
          
          acc.push({ month: monthKey, appointments: monthAppointments });
        }
        
        return acc;
      }, []);

    // Calculate metrics
    const totalSlots = Object.values(timeSlots[req.user.id] || {}).reduce(
      (total, daySlots) => total + daySlots.length,
      0
    );

    const bookingRate = totalSlots > 0
      ? Math.round((totalAppointments / totalSlots) * 100)
      : 0;

    const cancelledAppointments = orgAppointments.filter(apt => apt.status === 'cancelled').length;
    const cancellationRate = totalAppointments > 0
      ? Math.round((cancelledAppointments / totalAppointments) * 100)
      : 0;

    // For this example, we'll use a placeholder for satisfaction rate
    // In a real application, this would come from user ratings
    const satisfaction = 100;

    const analyticsData = {
      totalAppointments,
      completionRate,
      averageDaily,
      popularTimeSlot,
      monthlyData,
      metrics: {
        bookingRate,
        cancellationRate,
        satisfaction
      }
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});

// Initialize default settings for a new organization
export function initializeOrganizationSettings(organizationId: string) {
  settings[organizationId] = {
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
  };
  lockedDays[organizationId] = [];
  timeSlots[organizationId] = {};
}

// Helper function to generate time slots for a specific day
function generateTimeSlots(
  date: string,
  orgSettings: OrganizationSettings
): TimeSlot[] {
  const dayOfWeek = format(new Date(date), "EEEE");
  const daySettings = orgSettings.businessHours.find(
    (h) => h.day === dayOfWeek
  );

  if (!daySettings || !daySettings.isOpen) {
    return [];
  }

  const slots: TimeSlot[] = [];
  const startTime = parse(daySettings.start, "HH:mm", new Date());
  const endTime = parse(daySettings.end, "HH:mm", new Date());

  let currentTime = startTime;
  while (isWithinInterval(currentTime, { start: startTime, end: endTime })) {
    const slotEnd = addMinutes(currentTime, orgSettings.slotDuration);
    if (isWithinInterval(slotEnd, { start: startTime, end: endTime })) {
      slots.push({
        id: uuidv4(),
        start: format(currentTime, "HH:mm"),
        end: format(slotEnd, "HH:mm"),
        isAvailable: true,
      });
    }
    currentTime = addMinutes(slotEnd, orgSettings.breakBetweenSlots);
  }

  return slots;
}

// Get all organizations (public)
router.get("/", (req, res) => {
  try {
    const publicOrgs = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      description: org.description || "",
    }));
    res.json(publicOrgs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch organizations" });
  }
});

// Get organization settings
router.get("/settings", (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Initialize settings if they don't exist
    if (!settings[req.user.id]) {
      initializeOrganizationSettings(req.user.id);
    }

    res.json(settings[req.user.id]);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

// Update organization settings
router.put("/settings", (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const settingsSchema = z.object({
      businessHours: z.array(
        z.object({
          day: z.string(),
          start: z.string(),
          end: z.string(),
          isOpen: z.boolean(),
        })
      ),
      slotDuration: z.number().min(15).max(120),
      breakBetweenSlots: z.number().min(0).max(60),
    });

    const validatedData = settingsSchema.parse(req.body);

    // Initialize settings if they don't exist
    if (!settings[req.user.id]) {
      initializeOrganizationSettings(req.user.id);
    }

    // Update settings
    settings[req.user.id] = {
      ...settings[req.user.id],
      ...validatedData,
    };

    // Clear cached time slots to regenerate them with new settings
    timeSlots[req.user.id] = {};

    res.json(settings[req.user.id]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update settings" });
  }
});

// Get slot status for a date range
router.get("/slots/status", (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { start, end } = req.query;
    if (
      !start ||
      !end ||
      typeof start !== "string" ||
      typeof end !== "string"
    ) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const orgId = req.user.id;

    // Initialize settings if they don't exist
    if (!settings[orgId]) {
      initializeOrganizationSettings(orgId);
    }

    // Initialize time slots for organization if they don't exist
    if (!timeSlots[orgId]) {
      timeSlots[orgId] = {};
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const statuses: Record<
      string,
      {
        isLocked: boolean;
        availableSlots: number;
        totalSlots: number;
      }
    > = {};

    days.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");

      // Generate slots if they don't exist
      if (!timeSlots[orgId][dateStr]) {
        timeSlots[orgId][dateStr] = generateTimeSlots(dateStr, settings[orgId]);
      }

      const daySlots = timeSlots[orgId][dateStr];

      // Check for booked slots
      const bookedSlotsForDate = bookedSlots[dateStr];
      if (bookedSlotsForDate) {
        daySlots.forEach((slot) => {
          const isBooked = bookedSlotsForDate.timeSlots.some(
            (bookedSlot) =>
              bookedSlot.start === slot.start && bookedSlot.end === slot.end
          );
          if (isBooked) {
            slot.isAvailable = false;
          }
        });
      }

      statuses[dateStr] = {
        isLocked: lockedDays[orgId].includes(dateStr),
        availableSlots: daySlots.filter((slot) => slot.isAvailable).length,
        totalSlots: daySlots.length,
      };
    });

    res.json(statuses);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to fetch slot statuses" });
  }
});

// Get time slots for a specific day
router.get("/slots/:date", (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { date } = req.params;
    const orgId = req.user.id;

    // Generate or get existing slots
    let slots =
      timeSlots[orgId]?.[date] || generateTimeSlots(date, settings[orgId]);

    // Check for booked slots
    const bookedSlotsForDate = bookedSlots[date];
    if (bookedSlotsForDate) {
      slots = slots.map((slot) => {
        const isBooked = bookedSlotsForDate.timeSlots.some(
          (bookedSlot) =>
            bookedSlot.start === slot.start && bookedSlot.end === slot.end
        );
        return {
          ...slot,
          isAvailable: isBooked ? false : slot.isAvailable,
        };
      });
    }

    res.json({
      slots,
      isLocked: lockedDays[orgId].includes(date),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch time slots" });
  }
});

// Update time slots for a specific day
router.put("/slots/:date", (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { date } = req.params;
    const orgId = req.user.id;
    const updatedSlots = req.body;

    // Validate slots
    const slotSchema = z.array(
      z.object({
        id: z.string(),
        start: z.string(),
        end: z.string(),
        isAvailable: z.boolean(),
      })
    );

    const validatedSlots = slotSchema.parse(updatedSlots);
    timeSlots[orgId][date] = validatedSlots;

    res.json({
      date,
      slots: timeSlots[orgId][date],
      isLocked: lockedDays[orgId].includes(date),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update time slots" });
  }
});

// Toggle locked status for a day
router.put("/locked-days/:date", (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { date } = req.params;
    const { isLocked } = req.body;
    const orgId = req.user.id;

    if (isLocked) {
      if (!lockedDays[orgId].includes(date)) {
        lockedDays[orgId].push(date);
      }
    } else {
      lockedDays[orgId] = lockedDays[orgId].filter((d) => d !== date);
    }

    res.json({ date, isLocked });
  } catch (error) {
    res.status(500).json({ message: "Failed to update locked status" });
  }
});

export { router };
