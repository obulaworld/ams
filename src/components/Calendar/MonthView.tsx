import React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isPast,
  isValid,
} from "date-fns";
import {
  Lock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

interface MonthViewProps {
  currentDate: Date;
  lockedDays: string[];
  onDayClick: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  isOrganization?: boolean;
  dayStatuses?: Record<
    string,
    {
      isLocked: boolean;
      availableSlots: number;
      totalSlots: number;
    }
  >;
}

export default function MonthView({
  currentDate = new Date(),
  lockedDays = [],
  onDayClick,
  onMonthChange,
  isOrganization = true,
  dayStatuses = {},
}: MonthViewProps) {
  // Ensure we have a valid date
  const validCurrentDate = new Date();
  if (isValid(currentDate)) {
    validCurrentDate.setTime(currentDate.getTime());
  }

  const monthStart = startOfMonth(validCurrentDate);
  const monthEnd = endOfMonth(validCurrentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePreviousMonth = () => {
    const newDate = subMonths(validCurrentDate, 1);
    onMonthChange?.(newDate);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(validCurrentDate, 1);
    onMonthChange?.(newDate);
  };

  const isDayLocked = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    return dayStatuses[dateStr]?.isLocked || false;
  };

  const getDayStatus = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return dayStatuses[dateStr];
  };

  const isDayDisabled = (date: Date): boolean => {
    // Past days are always disabled
    if (isPast(date) && !isToday(date)) return true;

    // For individuals, locked days are disabled
    if (!isOrganization && isDayLocked(date)) return true;

    // For individuals, days with no available slots are disabled
    if (!isOrganization) {
      const status = getDayStatus(date);
      if (status && status.availableSlots === 0) return true;
    }

    return false;
  };

  const handleDayClick = (date: Date) => {
    if (!isDayDisabled(date)) {
      onDayClick(date);
    }
  };

  const getDayStatusIndicator = (date: Date) => {
    const status = getDayStatus(date);
    if (!status) return null;

    if (status.isLocked) {
      return (
        <div className="absolute bottom-2 right-2 flex items-center">
          <Lock className="h-4 w-4 text-red-500" />
        </div>
      );
    }

    if (status.availableSlots === 0) {
      return (
        <div className="absolute bottom-2 right-2 flex items-center">
          <AlertCircle className="h-4 w-4 text-orange-500" />
        </div>
      );
    }

    if (status.availableSlots < status.totalSlots) {
      return (
        <div className="absolute bottom-2 right-2 text-xs font-medium">
          <span className="text-blue-600">{status.availableSlots}</span>
          <span className="text-gray-400">/{status.totalSlots}</span>
        </div>
      );
    }

    return (
      <div className="absolute bottom-2 right-2 text-xs font-medium text-green-600">
        {status.totalSlots} slots
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(validCurrentDate, "MMMM yyyy")}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700"
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const isLocked = isDayLocked(day);
          const disabled = isDayDisabled(day);
          const status = getDayStatus(day);

          return (
            <button
              key={day.toString()}
              onClick={() => handleDayClick(day)}
              disabled={disabled}
              className={`
                relative bg-white p-3 h-24 transition-colors
                ${
                  disabled
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-gray-50"
                }
                ${!isSameMonth(day, validCurrentDate) && "text-gray-400"}
                ${isToday(day) && "bg-blue-50"}
                ${status?.isLocked && "bg-red-50"}
                ${
                  status?.availableSlots === 0 &&
                  !status?.isLocked &&
                  "bg-orange-50"
                }
              `}
            >
              <time dateTime={format(day, "yyyy-MM-dd")} className="text-sm">
                {format(day, "d")}
              </time>
              {getDayStatusIndicator(day)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
