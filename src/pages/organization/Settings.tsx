import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Plus, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { BusinessHours } from "../../types";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().min(5, "Address must be at least 5 characters"),
  businessHours: z.array(
    z.object({
      day: z.string(),
      start: z.string(),
      end: z.string(),
      isOpen: z.boolean(),
    })
  ),
  slotDuration: z
    .number()
    .min(15, "Minimum duration is 15 minutes")
    .max(120, "Maximum duration is 120 minutes"),
  breakBetweenSlots: z
    .number()
    .min(0, "Break cannot be negative")
    .max(60, "Maximum break is 60 minutes"),
});

type SettingsForm = z.infer<typeof schema>;

const defaultBusinessHours: BusinessHours[] = [
  { day: "Monday", start: "09:00", end: "17:00", isOpen: true },
  { day: "Tuesday", start: "09:00", end: "17:00", isOpen: true },
  { day: "Wednesday", start: "09:00", end: "17:00", isOpen: true },
  { day: "Thursday", start: "09:00", end: "17:00", isOpen: true },
  { day: "Friday", start: "09:00", end: "17:00", isOpen: true },
  { day: "Saturday", start: "09:00", end: "13:00", isOpen: false },
  { day: "Sunday", start: "09:00", end: "13:00", isOpen: false },
];

export default function Settings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<SettingsForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      description: "",
      phone: "",
      address: "",
      businessHours: defaultBusinessHours,
      slotDuration: 30,
      breakBetweenSlots: 0,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [profileResponse, settingsResponse] = await Promise.all([
        fetch("http://localhost:3000/api/profile", {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
        }),
        fetch("http://localhost:3000/api/organizations/settings", {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
        }),
      ]);

      if (!profileResponse.ok || !settingsResponse.ok) {
        throw new Error("Failed to fetch settings");
      }

      const profileData = await profileResponse.json();
      const settingsData = await settingsResponse.json();

      reset({
        ...profileData,
        ...settingsData,
      });
    } catch (err) {
      setError("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SettingsForm) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const [profileResponse, settingsResponse] = await Promise.all([
        fetch("http://localhost:3000/api/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            description: data.description,
            phone: data.phone,
            address: data.address,
          }),
        }),
        fetch("http://localhost:3000/api/organizations/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("token") || sessionStorage.getItem("token")
            }`,
          },
          body: JSON.stringify({
            businessHours: data.businessHours,
            slotDuration: data.slotDuration,
            breakBetweenSlots: data.breakBetweenSlots,
          }),
        }),
      ]);

      if (!profileResponse.ok || !settingsResponse.ok) {
        throw new Error("Failed to update settings");
      }

      setSuccessMessage("Settings saved successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Failed to save settings");
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Organization Settings
        </h1>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isSaving}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Save Changes
            </>
          )}
        </button>
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                {...register("name")}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your organization name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
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
                placeholder="contact@organization.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                {...register("phone")}
                type="tel"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 000-0000"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                {...register("address")}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Business St, City, State"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about your organization..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Time Slot Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slot Duration (minutes)
              </label>
              <input
                {...register("slotDuration", { valueAsNumber: true })}
                type="number"
                min="15"
                max="120"
                step="15"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.slotDuration && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.slotDuration.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Break Between Slots (minutes)
              </label>
              <input
                {...register("breakBetweenSlots", { valueAsNumber: true })}
                type="number"
                min="0"
                max="60"
                step="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.breakBetweenSlots && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.breakBetweenSlots.message}
                </p>
              )}
            </div>
          </div>

          <h3 className="text-md font-medium text-gray-900 mb-4">
            Business Hours
          </h3>
          <div className="space-y-4">
            {defaultBusinessHours.map((hours, index) => (
              <div
                key={hours.day}
                className="grid grid-cols-4 gap-4 items-center"
              >
                <div className="text-sm font-medium text-gray-700">
                  {hours.day}
                </div>
                <div>
                  <input
                    {...register(`businessHours.${index}.start`)}
                    type="time"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <input
                    {...register(`businessHours.${index}.end`)}
                    type="time"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="inline-flex items-center">
                    <input
                      {...register(`businessHours.${index}.isOpen`)}
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-blue-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Open</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
