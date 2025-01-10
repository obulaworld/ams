import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Menu,
  X,
  Calendar,
  Settings,
  Users,
  BarChart3,
  User,
  FileText,
  Plus,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const isOrganization = user?.role === "organization";

  const navigationItems = isOrganization
    ? [
        { path: "/organization", icon: Calendar, label: "Dashboard" },
        { path: "/organization/calendar", icon: Calendar, label: "Calendar" },
        {
          path: "/organization/appointments",
          icon: FileText,
          label: "Appointments",
        },
        {
          path: "/organization/analytics",
          icon: BarChart3,
          label: "Analytics",
        },
        { path: "/organization/settings", icon: Settings, label: "Settings" },
      ]
    : [
        { path: "/individual", icon: Calendar, label: "Dashboard" },
        { path: "/individual/book", icon: Plus, label: "Book Appointment" },
        { path: "/individual/profile", icon: User, label: "Profile" },
      ];

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to={`/${user?.role}`} className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">
              AppointmentPro
            </span>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Container */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-64 transform lg:translate-x-0 lg:relative
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
            transition-transform duration-200 ease-in-out
          `}
        >
          {/* Overlay */}
          {isOpen && (
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75 lg:hidden -z-10"
              onClick={() => setIsOpen(false)}
            />
          )}

          {/* Sidebar Content */}
          <div className="flex flex-col h-full bg-white border-r">
            {/* Logo - Desktop */}
            <div className="hidden lg:flex items-center p-4 border-b">
              <Calendar className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                AppointmentPro
              </span>
            </div>

            {/* Navigation */}
            <div className="flex-1 flex flex-col min-h-0">
              <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {navigationItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center px-4 py-2 text-sm font-medium rounded-lg
                      ${
                        isActivePath(item.path)
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* User Profile & Logout */}
              <div className="flex-shrink-0 p-4 border-t">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
