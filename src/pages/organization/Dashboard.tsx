import React, { useEffect, useState } from "react";
import { format, isToday } from "date-fns";
import {
  Calendar,
  Clock,
  Users,
  Bookmark,
  Settings as SettingsIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Appointment } from "../../types";

interface AppointmentStats {
  total: number;
  confirmed: number;
  cancelled: number;
  pending: number;
}

export default function OrganizationDashboard() {
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    confirmed: 0,
    cancelled: 0,
    pending: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchStats(), fetchTodayAppointments()]).finally(() =>
      setIsLoading(false)
    );
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/appointments/stats",
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      setError("Failed to fetch appointment statistics");
    }
  };

  const fetchTodayAppointments = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const response = await fetch(
        `http://localhost:3000/api/appointments/filter?date=${today}`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setTodayAppointments(data);
      }
    } catch (error) {
      setError("Failed to fetch today's appointments");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Organization Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="h-8 w-8 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">
              {stats.total}
            </span>
          </div>
          <p className="text-sm text-gray-600">Total Appointments</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="h-8 w-8 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">
              {stats.confirmed}
            </span>
          </div>
          <p className="text-sm text-gray-600">Confirmed Appointments</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 text-purple-600" />
            <span className="text-3xl font-bold text-gray-900">
              {stats.pending}
            </span>
          </div>
          <p className="text-sm text-gray-600">Pending Appointments</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <Bookmark className="h-8 w-8 text-orange-600" />
            <span className="text-3xl font-bold text-gray-900">
              {stats.cancelled}
            </span>
          </div>
          <p className="text-sm text-gray-600">Cancelled Appointments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Schedule
          </h2>
          <div className="space-y-4">
            {todayAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No appointments scheduled for today
              </p>
            ) : (
              todayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {appointment.individualName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Appointment #{appointment.number}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                      appointment.status
                    )}`}
                  >
                    {appointment.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/organization/calendar"
              className="p-4 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Calendar className="h-6 w-6 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Manage Calendar</p>
              <p className="text-sm text-gray-600">
                Set availability and schedules
              </p>
            </Link>

            <Link
              to="/organization/appointments"
              className="p-4 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Users className="h-6 w-6 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">View Appointments</p>
              <p className="text-sm text-gray-600">
                Manage bookings and requests
              </p>
            </Link>

            <Link
              to="/organization/settings"
              className="p-4 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <SettingsIcon className="h-6 w-6 text-gray-600 mb-2" />
              <p className="font-medium text-gray-900">Settings</p>
              <p className="text-sm text-gray-600">
                Configure your organization
              </p>
            </Link>

            <Link
              to="/organization/analytics"
              className="p-4 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Users className="h-6 w-6 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">Analytics</p>
              <p className="text-sm text-gray-600">
                View reports and statistics
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
