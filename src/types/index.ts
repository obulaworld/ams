export type UserRole = "organization" | "individual";

export interface TimeSlot {
  id: string;
  start: string; // HH:mm format
  end: string; // HH:mm format
  isAvailable: boolean;
}

export interface BusinessHours {
  day: string;
  start: string; // HH:mm format
  end: string; // HH:mm format
  isOpen: boolean;
}

export interface OrganizationSettings {
  businessHours: BusinessHours[];
  slotDuration: number; // in minutes
  breakBetweenSlots: number; // in minutes
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface Organization extends User {
  description?: string;
  settings: OrganizationSettings;
}

export interface Individual extends User {
  phone?: string;
}

export interface Appointment {
  id: string;
  organizationId: string;
  organizationName: string;
  individualId: string;
  individualName: string;
  date: Date;
  timeSlot: TimeSlot;
  status: "pending" | "confirmed" | "cancelled";
  notes?: string;
  number: string;
  createdAt: Date;
}

export interface DayTimeSlots {
  date: string;
  slots: TimeSlot[];
  isLocked: boolean;
}
