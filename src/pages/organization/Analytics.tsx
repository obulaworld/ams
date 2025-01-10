import React, { useEffect, useState } from "react";
import {
  BarChart,
  Calendar,
  Users,
  TrendingUp,
  Download,
  Filter,
  Loader2,
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface AnalyticsData {
  totalAppointments: number;
  completionRate: number;
  averageDaily: number;
  popularTimeSlot: string;
  monthlyData: { month: string; appointments: number }[];
  metrics: {
    bookingRate: number;
    cancellationRate: number;
    satisfaction: number;
  };
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(subMonths(new Date(), 2)), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/organizations/analytics?start=${dateRange.start}&end=${dateRange.end}`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const analyticsData = await response.json();
      setData(analyticsData);
      setError(null);
    } catch (error) {
      setError("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    if (!data) return;

    const reportData = {
      title: "Analytics Report",
      generatedAt: format(new Date(), "PPP"),
      dateRange: {
        from: format(new Date(dateRange.start), "PPP"),
        to: format(new Date(dateRange.end), "PPP"),
      },
      data,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Analytics & Reports
        </h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={exportReport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-5 w-5 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="h-8 w-8 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">
              {data.totalAppointments}
            </span>
          </div>
          <p className="text-sm text-gray-600">Total Appointments</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">
              {data.completionRate}%
            </span>
          </div>
          <p className="text-sm text-gray-600">Completion Rate</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 text-purple-600" />
            <span className="text-3xl font-bold text-gray-900">
              {data.averageDaily}
            </span>
          </div>
          <p className="text-sm text-gray-600">Daily Average</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <BarChart className="h-8 w-8 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">
              {data.popularTimeSlot}
            </span>
          </div>
          <p className="text-sm text-gray-600">Most Popular Time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Appointments
          </h2>
          <div className="h-64">
            <div className="flex h-full items-end space-x-2">
              {data.monthlyData.map((item, index) => (
                <div
                  key={item.month}
                  className="flex-1 flex flex-col items-center"
                >
                  <div
                    className="w-full bg-blue-600 rounded-t transition-all duration-300"
                    style={{
                      height: `${
                        (item.appointments /
                          Math.max(
                            ...data.monthlyData.map((d) => d.appointments)
                          )) *
                        100
                      }%`,
                    }}
                  />
                  <div className="mt-2 text-sm font-medium text-gray-600">
                    {item.month}
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.appointments}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Metrics
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Booking Rate
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {data.metrics.bookingRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${data.metrics.bookingRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Cancellation Rate
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {data.metrics.cancellationRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${data.metrics.cancellationRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Customer Satisfaction
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {data.metrics.satisfaction}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${data.metrics.satisfaction}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
