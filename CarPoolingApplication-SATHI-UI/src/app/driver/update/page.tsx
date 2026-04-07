"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchDriverProfile, updateDriverProfile, DriverProfileUpdateRequest } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import CustomSelect from "@/components/CustomSelect";

export default function UpdateDriverProfilePage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: rootLoading } = useAuth();
  
  const [form, setForm] = useState({
    licenseExpirationDate: "",
    vehicleModel: "",
    vehicleNumber: "",
    vehicleSeatCapacity: 1,
    vehicleCategory: "HATCHBACK",
    vehicleClass: "ECONOMY",
  });

  const originalData = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!rootLoading && !isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [rootLoading, isLoggedIn, router]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchDriverProfile();
        if (mounted && data) {
          const profileData = {
            licenseExpirationDate: data.licenseExpirationDate || "",
            vehicleModel: data.vehicleModel || "",
            vehicleNumber: data.vehicleNumber || "",
            vehicleSeatCapacity: data.vehicleSeatCapacity || 1,
            vehicleCategory: data.vehicleCategory || "HATCHBACK",
            vehicleClass: data.vehicleClass || "ECONOMY",
          };
          setForm(profileData);
          originalData.current = profileData;
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load driver profile.");
          if (err.message?.toLowerCase().includes("not found")) {
             router.push("/driver/register");
          }
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "vehicleSeatCapacity" ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // 1. Validate Form
    if (!form.licenseExpirationDate) {
      setError("License expiration date is required");
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(form.licenseExpirationDate);
    if (expDate <= today) {
       setError("License expiration date must be in the future");
       return;
    }
    if (!form.vehicleModel.trim()) { setError("Vehicle model is required"); return; }
    if (!form.vehicleNumber.trim()) { setError("Vehicle number is required"); return; }
    if (form.vehicleSeatCapacity < 1 || form.vehicleSeatCapacity > 20) {
      setError("Seat capacity must be between 1 and 20");
      return;
    }

    // 2. Change Detection
    const changes: DriverProfileUpdateRequest = {};
    if (form.licenseExpirationDate !== originalData.current.licenseExpirationDate) changes.licenseExpirationDate = form.licenseExpirationDate;
    if (form.vehicleModel !== originalData.current.vehicleModel) changes.vehicleModel = form.vehicleModel;
    if (form.vehicleNumber !== originalData.current.vehicleNumber) changes.vehicleNumber = form.vehicleNumber;
    if (form.vehicleSeatCapacity !== originalData.current.vehicleSeatCapacity) changes.vehicleSeatCapacity = form.vehicleSeatCapacity;
    if (form.vehicleCategory !== originalData.current.vehicleCategory) changes.vehicleCategory = form.vehicleCategory;
    if (form.vehicleClass !== originalData.current.vehicleClass) changes.vehicleClass = form.vehicleClass;

    if (Object.keys(changes).length === 0) {
      setSuccess("No changes to save.");
      setTimeout(() => setSuccess(null), 2000);
      return;
    }

    // 3. Submit
    setSaving(true);
    try {
      await updateDriverProfile(changes);
      originalData.current = { ...originalData.current, ...changes };
      setSuccess("Driver profile updated successfully!");
      // Redirect back to driver profile after a brief delay
      setTimeout(() => {
        router.push("/driver/profile");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update driver profile");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || rootLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-fade-in-up flex justify-between items-center mb-6">
           <button
             onClick={() => router.push("/driver/profile")}
             className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
           >
             <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
             </svg>
             <span className="font-medium text-sm">Back to Driver Profile</span>
           </button>
        </div>

        <div className="glass-card p-8 animate-fade-in-up relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="mb-8 relative z-10">
            <h1 className="text-2xl font-bold text-white mb-2">Update Driver Profile</h1>
            <p className="text-slate-400">Modify your vehicle details and license information.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* License Expiration */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">License Expiration Date</label>
                <input
                  type="date"
                  name="licenseExpirationDate"
                  value={form.licenseExpirationDate}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a14]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                />
              </div>

              {/* Vehicle Model */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Vehicle Model</label>
                <input
                  name="vehicleModel"
                  value={form.vehicleModel}
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
                  value={form.vehicleNumber}
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
                  value={form.vehicleSeatCapacity}
                  onChange={handleChange}
                  className="w-full bg-[#0a0a14]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                />
              </div>

              {/* Vehicle Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Vehicle Category</label>
                <CustomSelect
                  value={form.vehicleCategory}
                  onChange={(val) => setForm({ ...form, vehicleCategory: val })}
                  options={[
                    { value: "HATCHBACK", label: "Hatchback" },
                    { value: "SEDAN", label: "Sedan" },
                    { value: "SUV", label: "SUV" },
                    { value: "MUV", label: "MUV" },
                    { value: "AUTO_RICKSHAW", label: "Auto Rickshaw" },
                    { value: "BIKE", label: "Bike" },
                  ]}
                />
              </div>

              {/* Vehicle Class */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Vehicle Class</label>
                <div className="grid grid-cols-3 gap-4">
                  {(["ECONOMY", "STANDARD", "PREMIUM"] as const).map((vClass) => (
                    <div
                      key={vClass}
                      onClick={() => setForm({ ...form, vehicleClass: vClass })}
                      className={`cursor-pointer rounded-xl border p-4 text-center transition-all duration-300 ${
                        form.vehicleClass === vClass
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
              disabled={saving}
              className="mt-8 w-full px-6 py-4 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && (
                 <svg className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" viewBox="0 0 24 24"></svg>
              )}
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </form>
        </div>

      </main>

      {/* Toast Notifications */}
      {(success || error) && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm animate-fade-in-up">
          {error && (
            <div className="bg-bg-card border border-red-500/30 shadow-lg shadow-red-500/10 rounded-xl p-4 flex items-start gap-3 backdrop-blur-xl">
              <div className="text-red-400 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-white font-medium">{error}</p>
              <button onClick={() => setError(null)} className="text-slate-400 hover:text-white ml-auto">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
          {success && (
            <div className="bg-bg-card border border-emerald-500/30 shadow-lg shadow-emerald-500/10 rounded-xl p-4 flex items-start gap-3 backdrop-blur-xl">
              <div className="text-emerald-400 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-white font-medium">{success}</p>
              <button onClick={() => setSuccess(null)} className="text-slate-400 hover:text-white ml-auto">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
