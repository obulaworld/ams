import React from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { TimeSlot } from "../../types";

interface TimeSlotPickerProps {
  date: Date;
  timeSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
}

export default function TimeSlotPicker({
  date,
  timeSlots,
  selectedSlot,
  onSelectSlot,
}: TimeSlotPickerProps) {
  const morningSlots = timeSlots.filter((slot) => {
    const hour = parseInt(slot.start.split(":")[0]);
    return hour < 12;
  });

  const afternoonSlots = timeSlots.filter((slot) => {
    const hour = parseInt(slot.start.split(":")[0]);
    return hour >= 12 && hour < 17;
  });

  const eveningSlots = timeSlots.filter((slot) => {
    const hour = parseInt(slot.start.split(":")[0]);
    return hour >= 17;
  });

  const renderTimeSlots = (slots: TimeSlot[], title: string) => {
    if (slots.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-500">{title}</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {slots.map((slot) => (
            <button
              key={`${slot.start}-${slot.end}`}
              onClick={() => onSelectSlot(slot)}
              disabled={!slot.isAvailable}
              className={`
                flex items-center p-3 rounded-lg border-2 transition-colors
                ${
                  selectedSlot?.start === slot.start
                    ? "border-blue-600 bg-blue-50"
                    : slot.isAvailable
                    ? "border-gray-200 hover:border-blue-600"
                    : "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                }
              `}
            >
              <Clock
                className={`h-4 w-4 mr-2 ${
                  selectedSlot?.start === slot.start
                    ? "text-blue-600"
                    : slot.isAvailable
                    ? "text-gray-400"
                    : "text-gray-300"
                }`}
              />
              <div className="text-left">
                <p
                  className={`text-sm font-medium ${
                    selectedSlot?.start === slot.start
                      ? "text-blue-900"
                      : slot.isAvailable
                      ? "text-gray-900"
                      : "text-gray-400"
                  }`}
                >
                  {slot.start} - {slot.end}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Available Time Slots for {format(date, "MMMM d, yyyy")}
      </h3>

      {timeSlots.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No available time slots for this date</p>
        </div>
      ) : (
        <div className="space-y-6">
          {renderTimeSlots(morningSlots, "Morning")}
          {renderTimeSlots(afternoonSlots, "Afternoon")}
          {renderTimeSlots(eveningSlots, "Evening")}
        </div>
      )}
    </div>
  );
}
