"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { registerDriver, DriverRegistrationPayload } from "@/lib/api";

export default function DriverRegistrationPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<DriverRegistrationPayload>({
    licenseNumber: "",
    licenseExpirationDate: "",
    vehicleModel: "",
    vehicleNumber: "",
    vehicleSeatCapacity: 1,
    vehicleCategory: "HATCHBACK",
    vehicleClass: "ECONOMY",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "vehicleSeatCapacity" ? parseInt(value) || 1 : value,
    }));
  };

  const validateForm = () => {
    if (!formData.licenseNumber.trim()) return "License number is required";
    if (!formData.licenseExpirationDate) return "License expiration date is required";
    
    // Check if future date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(formData.licenseExpirationDate);
    if (expDate <= today) return "License expiration date must be in the future";

    if (!formData.vehicleModel.trim()) return "Vehicle model is required";
    if (!formData.vehicleNumber.trim()) return "Vehicle number is required";
    if (formData.vehicleSeatCapacity < 1 || formData.vehicleSeatCapacity > 20) {
      return "Seat capacity must be between 1 and 20";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await registerDriver(formData);
      router.push("/driver/profile");
    } catch (err: any) {
      setError(err.message || "Failed to register driver profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group w-fit"
        >
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium text-sm">Back to Dashboard</span>
        </button>
        <div className="glass-card p-8 animate-fade-in-up relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="mb-8 relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2">Become a Driver</h1>
            <p className="text-slate-400">Join our community and start sharing your rides to save costs.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-fade-in-up">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* License Number */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">License Number</label>
                <input
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a14]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 uppercase"
                  placeholder="e.g. MH12XYZ1234"
                />
              </div>

              {/* License Expiration */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">License Expiration Date</label>
                <input
                  type="date"
                  name="licenseExpirationDate"
                  value={formData.licenseExpirationDate}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a14]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                />
              </div>

              {/* Vehicle Model */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Vehicle Model</label>
                <input
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a14]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                  placeholder="e.g. Maruti Suzuki Swift"
                />
              </div>

              {/* Vehicle Number */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Vehicle Number</label>
                <input
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a14]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 uppercase"
                  placeholder="e.g. MH12AB1234"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Seat Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  name="vehicleSeatCapacity"
                  value={formData.vehicleSeatCapacity}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a14]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                />
              </div>

              {/* Vehicle Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Vehicle Category</label>
                <select
                  name="vehicleCategory"
                  value={formData.vehicleCategory}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a14]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                >
                  <option value="HATCHBACK">Hatchback</option>
                  <option value="SEDAN">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="MUV">MUV</option>
                  <option value="AUTO_RICKSHAW">Auto Rickshaw</option>
                  <option value="BIKE">Bike</option>
                </select>
              </div>

              {/* Vehicle Class */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Vehicle Class</label>
                <div className="grid grid-cols-3 gap-4">
                  {(["ECONOMY", "STANDARD", "PREMIUM"] as const).map((vClass) => (
                    <div
                      key={vClass}
                      onClick={() => setFormData({ ...formData, vehicleClass: vClass })}
                      className={`cursor-pointer rounded-xl border p-4 text-center transition-all duration-300 ${
                        formData.vehicleClass === vClass
                          ? "border-indigo-500 bg-indigo-500/10 text-white"
                          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/30"
                      }`}
                    >
                      <span className="text-sm font-bold">{vClass}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-8 w-full px-6 py-4 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? "Registering..." : "Submit Registration"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
