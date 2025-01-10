import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, FileText, Plus, Loader2, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { Appointment } from "../../types";

export default function IndividualDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const appointmentsPerPage = 5;

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateRange]);

  const fetchAppointments = async () => {
    try {
      let url = "http://localhost:3000/api/appointments/filter?";
      if (statusFilter !== "all") {
        url += `status=${statusFilter}&`;
      }
      if (dateRange.startDate) {
        url += `startDate=${dateRange.startDate}&`;
      }
      if (dateRange.endDate) {
        url += `endDate=${dateRange.endDate}&`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch appointments");
      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      setError("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  };

  const upcomingAppointment = appointments.find(
    (apt) => new Date(apt.date) >= new Date() && apt.status === "confirmed"
  );

  const filteredAppointments = appointments.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(
    indexOfFirstAppointment,
    indexOfLastAppointment
  );
  const totalPages = Math.ceil(
    filteredAppointments.length / appointmentsPerPage
  );

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <Link
          to="/individual/book"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto justify-center sm:justify-start"
        >
          <Plus className="h-5 w-5 mr-2" />
          Book Appointment
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {upcomingAppointment && (
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming Appointment
          </h2>
          <div className="flex items-start space-x-4">
            <Calendar className="h-8 w-8 text-blue-600 mt-1" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {upcomingAppointment.organizationName}
              </p>
              <p className="text-sm text-gray-600">
                {format(new Date(upcomingAppointment.date), "MMMM d, yyyy")}
              </p>
              <p className="text-sm text-gray-600">
                Appointment #{upcomingAppointment.number}
              </p>
              <span className="inline-flex items-center px-2.5 py-0.5 mt-2 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {upcomingAppointment.status}
              </span>
            </div>
            <Link
              to={`/individual/appointments/${upcomingAppointment.id}`}
              className="flex items-center text-sm text-blue-600 hover:text-blue-700"
            >
              <FileText className="h-4 w-4 mr-1" />
              View Details
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            All Appointments
          </h2>

          {/* Filter Controls */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2 w-full">
              <Filter className="h-5 w-5 text-gray-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
              <div className="flex-1">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Start date"
                />
              </div>
              <div className="flex items-center justify-center">
                <span className="text-gray-500 text-sm">to</span>
              </div>
              <div className="flex-1">
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="End date"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop view */}
        <div className="hidden lg:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentAppointments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No appointments found
                  </td>
                </tr>
              ) : (
                currentAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.organizationName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(appointment.date), "MMMM d, yyyy")}
                      </div>
                      <div className="text-sm text-gray-500">
                        Appointment #{appointment.number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {appointment.notes || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/individual/appointments/${appointment.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FileText className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile view */}
        <div className="lg:hidden space-y-4">
          {currentAppointments.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No appointments found
            </div>
          ) : (
            currentAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {appointment.organizationName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Appointment #{appointment.number}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      appointment.status
                    )}`}
                  >
                    {appointment.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Date:</span>{" "}
                    {format(new Date(appointment.date), "PPP")}
                  </p>
                  {appointment.notes && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span>{" "}
                      {appointment.notes}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <Link
                    to={`/individual/appointments/${appointment.id}`}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    View Details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
