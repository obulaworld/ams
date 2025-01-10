import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  FileText,
  Download,
  X,
  Loader2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { Appointment } from "../../types";

export default function AppointmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const fetchAppointment = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/appointments/${id}`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch appointment");
      const data = await response.json();
      setAppointment(data);
    } catch (err) {
      setError("Failed to load appointment details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment) return;

    try {
      setIsCancelling(true);
      const response = await fetch(
        `http://localhost:3000/api/appointments/${id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to cancel appointment");
      navigate("/individual");
    } catch (err) {
      setError("Failed to cancel appointment");
    } finally {
      setIsCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  const downloadDetails = () => {
    if (!appointment) return;

    const doc = new jsPDF();

    // Add logo/header
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246); // Blue color
    doc.text("AppointmentPro", 20, 20);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Appointment Details", 20, 35);

    doc.setFontSize(12);
    doc.text(`Appointment #${appointment.number}`, 20, 50);
    doc.text(`Date: ${format(new Date(appointment.date), "PPP")}`, 20, 65);
    doc.text(`Organization: ${appointment.organizationName}`, 20, 80);
    doc.text(`Status: ${appointment.status.toUpperCase()}`, 20, 95);

    if (appointment.notes) {
      doc.text("Notes:", 20, 110);
      doc.setFontSize(11);
      const splitNotes = doc.splitTextToSize(appointment.notes, 170);
      doc.text(splitNotes, 20, 120);
    }

    doc.save(`appointment-${appointment.number}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!appointment) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-50 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gray-50 p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Appointment Details
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Appointment #{appointment.number}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={downloadDetails}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
              {appointment.status === "pending" && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Status Banner */}
          <div
            className={`px-6 py-4 rounded-lg border ${getStatusColor(
              appointment.status
            )}`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {appointment.status === "confirmed" ? (
                  <Clock className="h-5 w-5" />
                ) : appointment.status === "cancelled" ? (
                  <X className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium capitalize">
                  {appointment.status === "confirmed"
                    ? "Appointment Confirmed"
                    : appointment.status === "cancelled"
                    ? "Appointment Cancelled"
                    : "Pending Confirmation"}
                </h3>
                <p className="mt-1 text-sm opacity-75">
                  {appointment.status === "confirmed"
                    ? "Your appointment has been confirmed."
                    : appointment.status === "cancelled"
                    ? "This appointment has been cancelled."
                    : "Waiting for organization confirmation."}
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <Calendar className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="mt-1 text-lg text-gray-900">
                    {format(new Date(appointment.date), "PPPP")}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Organization
                  </p>
                  <p className="mt-1 text-lg text-gray-900">
                    {appointment.organizationName}
                  </p>
                </div>
              </div>
            </div>

            {appointment.notes && (
              <div className="md:col-span-2">
                <div className="flex items-start space-x-3">
                  <FileText className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                      {appointment.notes}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Appointment?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this appointment? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
