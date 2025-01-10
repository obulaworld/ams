import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

interface ProfileResponse {
  name: string;
  email: string;
  phone?: string;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    reminders: boolean;
  };
}

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    reminders: z.boolean(),
  }),
});

type ProfileForm = z.infer<typeof schema>;

export default function Profile() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      notificationPreferences: {
        email: true,
        sms: false,
        reminders: true,
      },
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async (attempt = 0) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("http://localhost:3000/api/profile", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ProfileResponse = await response.json();

      reset({
        name: data.name || user?.name || "",
        email: data.email || user?.email || "",
        phone: data.phone || "",
        notificationPreferences: {
          ...data.notificationPreferences,
          email: data.notificationPreferences?.email ?? true,
          sms: data.notificationPreferences?.sms ?? false,
          reminders: data.notificationPreferences?.reminders ?? true,
        },
      });

      setRetryCount(0);
    } catch (err) {
      if (attempt < RETRY_ATTEMPTS) {
        setTimeout(() => fetchProfile(attempt + 1), RETRY_DELAY);
        setRetryCount(attempt + 1);
      } else {
        setError(
          `Failed to load profile: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("http://localhost:3000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            localStorage.getItem("token") || sessionStorage.getItem("token")
          }`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSuccessMessage("Profile updated successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        `Failed to update profile: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsSaving(false);
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
        Profile Settings
      </h1>

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

      {retryCount > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 text-yellow-700 rounded-lg">
          Retrying... Attempt {retryCount} of {RETRY_ATTEMPTS}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              {...register("name")}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              {...register("email")}
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (Optional)
            </label>
            <input
              {...register("phone")}
              type="tel"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Notification Preferences
            </h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  {...register("notificationPreferences.email")}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Email notifications
                </span>
              </label>

              <label className="flex items-center">
                <input
                  {...register("notificationPreferences.sms")}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  SMS notifications
                </span>
              </label>

              <label className="flex items-center">
                <input
                  {...register("notificationPreferences.reminders")}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Appointment reminders
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Save className="h-5 w-5 mr-2" />
                Save Changes
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
