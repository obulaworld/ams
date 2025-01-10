import React, { useState, useEffect } from "react";
import { format, parse, addMinutes, startOfMonth, endOfMonth } from "date-fns";
import {
  Calendar as CalendarIcon,
  Save,
  Lock,
  Unlock,
  Clock,
  Loader2,
} from "lucide-react";
import MonthView from "../../components/Calendar/MonthView";
import { TimeSlot, DayTimeSlots } from "../../types";

export default function CalendarManagement() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayTimeSlots, setDayTimeSlots] = useState<DayTimeSlots | null>(null);
  const [dayStatuses, setDayStatuses] = useState<
    Record<
      string,
      {
        isLocked: boolean;
        availableSlots: number;
        totalSlots: number;
      }
    >
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchMonthStatuses(currentDate);
  }, [currentDate]);

  useEffect(() => {
    if (selectedDay) {
      fetchDayTimeSlots(format(selectedDay, "yyyy-MM-dd"));
    }
  }, [selectedDay]);

  const fetchMonthStatuses = async (date: Date) => {
    try {
      setIsLoading(true);
      const start = format(startOfMonth(date), "yyyy-MM-dd");
      const end = format(endOfMonth(date), "yyyy-MM-dd");

      const response = await fetch(
        `http://localhost:3000/api/organizations/slots/status?start=${start}&end=${end}`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch month statuses");
      }

      const data = await response.json();
      setDayStatuses(data);
    } catch (err) {
      setError("Failed to load month statuses");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDayTimeSlots = async (date: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/organizations/slots/${date}`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch time slots");
      }

      const data = await response.json();
      setDayTimeSlots(data);
    } catch (err) {
      setError("Failed to load time slots");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
    setSelectedDay(null);
    setDayTimeSlots(null);
  };

  const toggleDayLock = async () => {
    if (!selectedDay || !dayTimeSlots) return;

    try {
      setIsSaving(true);
      const date = format(selectedDay, "yyyy-MM-dd");

      const response = await fetch(
        `http://localhost:3000/api/organizations/locked-days/${date}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
          body: JSON.stringify({
            isLocked: !dayTimeSlots.isLocked,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update day lock status");
      }

      const data = await response.json();
      setDayTimeSlots((prev) =>
        prev ? { ...prev, isLocked: data.isLocked } : null
      );

      // Update day statuses
      setDayStatuses((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          isLocked: data.isLocked,
        },
      }));

      setSuccessMessage(
        `Day successfully ${data.isLocked ? "locked" : "unlocked"}`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Failed to update day lock status");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTimeSlot = async (slotId: string) => {
    if (!selectedDay || !dayTimeSlots) return;

    try {
      setIsSaving(true);
      const date = format(selectedDay, "yyyy-MM-dd");

      const updatedSlots = dayTimeSlots.slots.map((slot) =>
        slot.id === slotId ? { ...slot, isAvailable: !slot.isAvailable } : slot
      );

      const response = await fetch(
        `http://localhost:3000/api/organizations/slots/${date}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
          body: JSON.stringify(updatedSlots),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update time slot");
      }

      const data = await response.json();
      setDayTimeSlots(data);

      // Update day statuses
      const availableSlots = updatedSlots.filter(
        (slot) => slot.isAvailable
      ).length;
      setDayStatuses((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          availableSlots,
          totalSlots: updatedSlots.length,
        },
      }));

      setSuccessMessage("Time slot updated successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Failed to update time slot");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Calendar Management
        </h1>
        {selectedDay && dayTimeSlots && (
          <button
            onClick={toggleDayLock}
            disabled={isSaving}
            className={`
              flex items-center px-4 py-2 rounded-lg
              ${
                dayTimeSlots.isLocked
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }
              disabled:opacity-50
            `}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                {dayTimeSlots.isLocked ? (
                  <>
                    <Unlock className="h-5 w-5 mr-2" />
                    Unlock Day
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Lock Day
                  </>
                )}
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <MonthView
            currentDate={currentDate}
            lockedDays={[]}
            onDayClick={setSelectedDay}
            onMonthChange={handleMonthChange}
            isOrganization={true}
            dayStatuses={dayStatuses}
          />
        </div>

        <div>
          {selectedDay && dayTimeSlots ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Time Slots for {format(selectedDay, "MMMM d, yyyy")}
              </h2>

              {dayTimeSlots.slots.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No time slots available for this day
                </p>
              ) : (
                <div className="space-y-3">
                  {dayTimeSlots.slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => toggleTimeSlot(slot.id)}
                      disabled={dayTimeSlots.isLocked || isSaving}
                      className={`
                        w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors
                        ${
                          slot.isAvailable
                            ? "border-green-200 bg-green-50 hover:border-green-300"
                            : "border-red-200 bg-red-50 hover:border-red-300"
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <div className="flex items-center">
                        <Clock
                          className={`h-5 w-5 ${
                            slot.isAvailable ? "text-green-600" : "text-red-600"
                          } mr-3`}
                        />
                        <span className="text-gray-900">
                          {slot.start} - {slot.end}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          slot.isAvailable ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {slot.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-center text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p>Select a day to manage time slots</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
