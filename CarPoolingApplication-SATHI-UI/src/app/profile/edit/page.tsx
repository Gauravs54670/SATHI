"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { updateProfile, deleteEmergencyContact, EmergencyContactDTO } from "@/lib/api";
import Navbar from "@/components/Navbar";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import CustomSelect from "@/components/CustomSelect";

export default function EditProfilePage() {
  const { user, isLoggedIn, isLoading, refreshProfile } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    userFullName: "",
    gender: "",
    bio: "",
    phoneNumber: "",
  });

  const [contacts, setContacts] = useState<EmergencyContactDTO[]>([]);
  const originalData = useRef<any>(null);

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [showContactForm, setShowContactForm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [isLoading, isLoggedIn, router]);

  useEffect(() => {
    if (user && !originalData.current) {
      setForm({
        userFullName: user.userFullName || "",
        gender: user.gender || "",
        bio: user.bio || "",
        phoneNumber: user.phoneNumber || "",
      });
      setContacts(user.emergencyContacts || []);
      
      originalData.current = {
        userFullName: user.userFullName || "",
        gender: user.gender || "",
        bio: user.bio || "",
        phoneNumber: user.phoneNumber || "",
        emergencyContacts: user.emergencyContacts || [],
      };
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddContact = () => {
    if (contacts.length >= 3) {
      setError("Maximum 3 emergency contacts allowed.");
      return;
    }
    if (!contactName || !contactPhone) {
      setError("Name and contact number are required.");
      return;
    }
    const phonePattern = /^[6-9][0-9]{9}$/;
    if (!phonePattern.test(contactPhone)) {
      setError("Please provide a valid 10-digit Indian phone number.");
      return;
    }
    setContacts([...contacts, { name: contactName, contact: contactPhone }]);
    setContactName("");
    setContactPhone("");
    setShowContactForm(false);
    setError("");
  };

  const handleRemoveContact = async (index: number) => {
    const contact = contacts[index];
    if (contact.contactId) {
      try {
        setSaving(true);
        await deleteEmergencyContact(contact.contactId);
        await refreshProfile();
        setSuccess("Contact deleted successfully.");
        
        // Remove from local state
        const newContacts = [...contacts];
        newContacts.splice(index, 1);
        setContacts(newContacts);
        
        // Update original data so we don't try to add it back
        originalData.current.emergencyContacts = originalData.current.emergencyContacts.filter((c: any) => c.contactId !== contact.contactId);
        
        setTimeout(() => setSuccess(""), 3000);
      } catch (err: any) {
        setError(err.message || "Failed to remove contact");
      } finally {
        setSaving(false);
      }
    } else {
      // Just remove from local state
      const newContacts = [...contacts];
      newContacts.splice(index, 1);
      setContacts(newContacts);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Change detection logic
    const changes: any = {};
    if (form.userFullName !== originalData.current.userFullName) changes.userFullName = form.userFullName;
    if (form.gender !== originalData.current.gender) changes.gender = form.gender;
    if (form.bio !== originalData.current.bio) changes.bio = form.bio;
    
    if (form.phoneNumber !== originalData.current.phoneNumber) {
       const phonePattern = /^[6-9][0-9]{9}$/;
       if (!phonePattern.test(form.phoneNumber)) {
         setError("Please provide a valid 10-digit Indian phone number.");
         return;
       }
       changes.phoneNumber = form.phoneNumber;
    }

    // Only send new contacts
    const newContacts = contacts.filter((c) => !c.contactId);
    if (newContacts.length > 0) {
      changes.emergencyContacts = newContacts;
    }

    if (Object.keys(changes).length === 0) {
      setSuccess("No changes to save.");
      setTimeout(() => setSuccess(""), 2000);
      return;
    }

    setSaving(true);
    try {
      await updateProfile(changes);
      await refreshProfile();
      
      // Update original data snapshot
      originalData.current = {
        ...originalData.current,
        ...changes,
      };
      // Original contacts will be updated in next user effect
      originalData.current = null; // force reload from new user profile

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="animate-fade-in-up">
          <button
            onClick={() => router.push("/profile")}
            className="mb-4 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back to Profile
          </button>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-white">Update Profile</h1>
            <button
               type="button"
               onClick={() => setIsPasswordModalOpen(true)}
               className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
            >
               Change Password
            </button>
          </div>

          {/* Messages are now displayed globally as Toasts */}

          <div className="glass-card p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-lg font-semibold text-white border-b border-white/5 pb-2">Basic Info</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    name="userFullName"
                    value={form.userFullName}
                    onChange={handleChange}
                    className="sathi-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    className="sathi-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Gender</label>
                  <CustomSelect
                    value={form.gender}
                    onChange={(val) => setForm({ ...form, gender: val })}
                    options={[
                      { value: "Male", label: "Male" },
                      { value: "Female", label: "Female" },
                      { value: "Other", label: "Other" },
                    ]}
                    placeholder="Select gender"
                    className="sathi-input-custom-select-wrapper" 
                  />
                  {/* Note: since sathi-input has its own padding, custom select handles its own, so we let CustomSelect do its default or add specific classes if needed */}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email <span className="text-slate-500 text-xs">(Read-only)</span></label>
                  <input
                    type="email"
                    value={user.email}
                    className="sathi-input opacity-50 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Bio</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  className="sathi-textarea"
                  placeholder="Tell us a bit about yourself..."
                />
              </div>

              <div className="pt-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-4">
                  <h3 className="text-lg font-semibold text-white">Emergency Contacts</h3>
                  <span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-md">{contacts.length}/3 Contacts</span>
                </div>
                
                {contacts.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {contacts.map((contact, index) => (
                      <div key={contact.contactId || index} className="flex justify-between items-center bg-white/[0.03] border border-white/5 p-3 rounded-lg">
                        <div>
                          <p className="text-white font-medium text-sm">{contact.name}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{contact.contact}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveContact(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-md transition-colors"
                          title="Remove Contact"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {showContactForm ? (
                  <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-white mb-3">Add New Contact</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="sathi-input"
                      />
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="sathi-input"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                       <button
                         type="button"
                         onClick={() => { setShowContactForm(false); setContactName(""); setContactPhone(""); }}
                         className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                       >
                         Cancel
                       </button>
                       <button
                         type="button"
                         onClick={handleAddContact}
                         className="px-3 py-1.5 text-xs font-medium bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
                       >
                         Save Contact
                       </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowContactForm(true)}
                    disabled={contacts.length >= 3}
                    className="w-full py-3 border border-dashed border-white/10 rounded-lg text-slate-400 hover:text-white hover:border-indigo-400/50 hover:bg-indigo-500/5 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Add Emergency Contact
                  </button>
                )}
              </div>

              <div className="pt-6 border-t border-white/5">
                <button
                  type="submit"
                  disabled={saving}
                  className="sathi-btn py-3 w-full sm:w-auto sm:px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        email={user?.email || ""}
      />

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
              <button onClick={() => setError("")} className="text-slate-400 hover:text-white ml-auto">
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
              <button onClick={() => setSuccess("")} className="text-slate-400 hover:text-white ml-auto">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
