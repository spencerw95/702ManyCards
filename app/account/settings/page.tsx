"use client";

import { useState, useEffect, type FormEvent } from "react";

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export default function AccountSettingsPage() {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("US");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    fetch("/api/customer/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const c = data.customer;
          setCustomer(c);
          setName(c.name || "");
          setPhone(c.phone || "");
          setStreet(c.address?.street || "");
          setCity(c.address?.city || "");
          setState(c.address?.state || "");
          setZip(c.address?.zip || "");
          setCountry(c.address?.country || "US");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage("");

    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          address: { street, city, state, zip, country },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileMessage("Profile updated successfully.");
        setCustomer(data.customer);
      } else {
        setProfileMessage(data.error || "Update failed.");
      }
    } catch {
      setProfileMessage("Something went wrong.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMessage("Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setPasswordError(data.error || "Failed to change password.");
      }
    } catch {
      setPasswordError("Something went wrong.");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 rounded-[var(--radius-lg)] skeleton" />
        ))}
      </div>
    );
  }

  const inputClasses =
    "w-full px-3 py-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors";
  const labelClasses = "block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Settings</h1>

      {/* Profile form */}
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Profile Information</h2>

        {profileMessage && (
          <div className="mb-4 p-3 rounded-[var(--radius)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[var(--color-success)] text-sm">
            {profileMessage}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} required />
            </div>
            <div>
              <label className={labelClasses}>Email</label>
              <input type="email" value={customer?.email || ""} className={inputClasses + " opacity-50 cursor-not-allowed"} readOnly />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} placeholder="(555) 123-4567" />
          </div>

          <div className="border-t border-[var(--color-border)] pt-4 mt-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Shipping Address</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClasses}>Street</label>
                <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className={inputClasses} placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClasses}>City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>State</label>
                  <input type="text" value={state} onChange={(e) => setState(e.target.value)} className={inputClasses} placeholder="NV" />
                </div>
                <div>
                  <label className={labelClasses}>ZIP</label>
                  <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} className={inputClasses} placeholder="89101" />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Country</label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClasses} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-6 py-2.5 rounded-[var(--radius)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {profileSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Password change */}
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Change Password</h2>

        {passwordMessage && (
          <div className="mb-4 p-3 rounded-[var(--radius)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[var(--color-success)] text-sm">
            {passwordMessage}
          </div>
        )}
        {passwordError && (
          <div className="mb-4 p-3 rounded-[var(--radius)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-sm">
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className={labelClasses}>Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClasses} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClasses} required placeholder="Min. 6 characters" />
            </div>
            <div>
              <label className={labelClasses}>Confirm New Password</label>
              <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className={inputClasses} required />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-6 py-2.5 rounded-[var(--radius)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {passwordSaving ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
