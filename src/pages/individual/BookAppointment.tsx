import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Search, Building2, Loader2 } from "lucide-react";
import MonthView from "../../components/Calendar/MonthView";
import TimeSlotPicker from "../../components/Booking/TimeSlotPicker";
import { TimeSlot } from "../../types";

const schema = z.object({
  organizationId: z.string().min(1, "Please select an organization"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

type BookingForm = z.infer<typeof schema>;

interface Organization {
  id: string;
  name: string;
  description: string;
}

export default function BookAppointment() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
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
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingForm>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      fetchMonthStatuses(currentDate);
    }
  }, [selectedOrg, currentDate]);

  useEffect(() => {
    if (selectedOrg && selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedOrg, selectedDate]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/organizations", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch organizations");
      const data = await response.json();
      setOrganizations(data);
    } catch (err) {
      setError("Failed to load organizations");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthStatuses = async (date: Date) => {
    if (!selectedOrg) return;

    try {
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
      if (!response.ok) throw new Error("Failed to fetch availability");
      const data = await response.json();
      setDayStatuses(data);
    } catch (err) {
      setError("Failed to load availability");
    }
  };

  const fetchTimeSlots = async () => {
    if (!selectedOrg || !selectedDate) return;

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await fetch(
        `http://localhost:3000/api/organizations/slots/${dateStr}`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch time slots");
      const data = await response.json();
      setTimeSlots(data.slots.filter((slot: TimeSlot) => slot.isAvailable));
      setSelectedTimeSlot(null);
    } catch (err) {
      setError("Failed to load time slots");
      setTimeSlots([]);
    }
  };

  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleOrganizationSelect = (org: Organization) => {
    setSelectedOrg(org);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setDayStatuses({});
  };

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = async (data: BookingForm) => {
    if (!selectedDate || !selectedTimeSlot) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch("http://localhost:3000/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
        body: JSON.stringify({
          ...data,
          date: selectedDate,
          timeSlot: selectedTimeSlot,
        }),
      });

      if (!response.ok) throw new Error("Failed to book appointment");

      const appointment = await response.json();
      navigate(`/individual/appointments/${appointment.id}`);
    } catch (err) {
      setError("Failed to book appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Book an Appointment
      </h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select Organization
            </h2>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredOrganizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleOrganizationSelect(org)}
                    className={`w-full flex items-start p-4 rounded-lg border-2 transition-colors
                      ${
                        selectedOrg?.id === org.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-600"
                      }`}
                  >
                    <Building2 className="h-6 w-6 text-blue-600 mt-1" />
                    <div className="ml-3 text-left">
                      <p className="font-medium text-gray-900">{org.name}</p>
                      <p className="text-sm text-gray-500">{org.description}</p>
                    </div>
                  </button>
                ))}

                {filteredOrganizations.length === 0 && (
                  <p className="text-center py-4 text-gray-500">
                    No organizations found
                  </p>
                )}
              </div>
            </div>
          </div>

          {selectedOrg && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <MonthView
                currentDate={currentDate}
                lockedDays={[]}
                onDayClick={handleDayClick}
                onMonthChange={handleMonthChange}
                isOrganization={false}
                dayStatuses={dayStatuses}
              />
            </div>
          )}
        </div>

        {selectedDate && selectedOrg && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <TimeSlotPicker
                date={selectedDate}
                timeSlots={timeSlots}
                selectedSlot={selectedTimeSlot}
                onSelectSlot={setSelectedTimeSlot}
              />
            </div>

            {selectedTimeSlot && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Appointment Details
                </h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <input
                    type="hidden"
                    {...register("organizationId")}
                    value={selectedOrg?.id}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      {...register("notes")}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any special requirements or notes for your appointment..."
                    />
                    {errors.notes && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.notes.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Booking...
                      </div>
                    ) : (
                      "Confirm Booking"
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
