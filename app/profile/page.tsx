"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  createdAt: string;
};

function showToast(msg: string, type: "success" | "error" = "success") {
  const t = document.createElement("div");
  t.className = `toast toast--${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.classList.add("toast--hide");
    setTimeout(() => t.remove(), 400);
  }, 2000);
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchProfile();
    }
  }, [mounted]);

  async function fetchProfile() {
    try {
      setLoading(true);
      const res = await fetch("/api/me", {
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({
          name: data.name,
          email: data.email,
        });
        if (data.avatar) {
          setAvatarPreview(data.avatar);
        }
      } else if (res.status === 401) {
        router.push("/login");
      }
    } catch (e) {
      showToast("❌ Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("❌ File size must be less than 5MB", "error");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast("❌ Please select an image file", "error");
      return;
    }

    setAvatarFile(file);

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      showToast("❌ Name is required", "error");
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = profile?.avatar;

      // Upload avatar if changed
      if (avatarFile) {
        const formDataWithFile = new FormData();
        formDataWithFile.append("file", avatarFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formDataWithFile,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          avatarUrl = uploadData.url;
        } else {
          showToast("❌ Failed to upload avatar", "error");
          return;
        }
      }

      // Update profile
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          avatar: avatarUrl,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setEditing(false);
        setAvatarFile(null);
        showToast("✅ Profile updated successfully", "success");
      } else {
        showToast("❌ Failed to update profile", "error");
      }
    } catch (e) {
      console.error("Error:", e);
      showToast("❌ Error saving profile", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}></div>
          <p className="font-medium" style={{ color: "var(--accent)" }}>Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
        <div className="glass-card p-8 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--text)" }}>Not Signed In</h2>
          <p className="mb-6" style={{ color: "var(--muted)" }}>Please sign in to view and manage your profile settings.</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg"
            style={{ background: "var(--accent)" }}
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12 transition-colors duration-300" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10 fade-in">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            My Profile
          </h1>
          <p className="text-lg" style={{ color: "var(--muted)" }}>Manage your personal information and account settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 fade-in-up">
          {/* Left Column - Avatar Card */}
          <div className="md:col-span-1">
            <div className="glass-card p-6 flex flex-col items-center text-center h-full relative overflow-hidden group">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(to bottom, var(--accent-glow), transparent)" }}></div>

              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 shadow-xl">
                  <div className="w-full h-full rounded-full overflow-hidden relative" style={{ background: "var(--surface)" }}>
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold" style={{ color: "var(--muted)" }}>
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {editing && (
                      <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-all duration-300 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.6)" }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs font-medium text-white">Change</span>
                      </label>
                    )}
                  </div>
                </div>
                {!editing && (
                  <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg" style={{ background: "var(--surface)", borderColor: "var(--border)" }} title="Role">
                    <span className="text-sm">
                      {profile.role === "OWNER" ? "👑" : profile.role === "ADMIN" ? "🔧" : "👤"}
                    </span>
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>{profile.name}</h2>
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>{profile.email}</p>

              <div className="mt-auto w-full pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="flex justify-between items-center text-xs" style={{ color: "var(--muted)" }}>
                  <span>Member since</span>
                  <span className="font-medium" style={{ color: "var(--text)" }}>
                    {new Date(profile.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details & Edit */}
          <div className="md:col-span-2">
            <div className="glass-card p-8 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <svg width="200" height="200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="var(--text)" strokeWidth="1.5" />
                  <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-xl font-semibold flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <span className="w-1 h-6 rounded-full" style={{ background: "var(--accent)" }}></span>
                  Account Details
                </h3>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-colors border flex items-center gap-2 hover:opacity-90"
                    style={{ background: "var(--surface)", color: "var(--text)", borderColor: "var(--border)" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="space-y-6 relative z-10">
                {/* Name Field */}
                <div className="group">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg px-4 py-3 focus:outline-none transition-all border"
                      style={{
                        background: "var(--surface)",
                        color: "var(--text)",
                        borderColor: "var(--border)"
                      }}
                      placeholder="Enter your name"
                    />
                  ) : (
                    <div className="text-lg font-medium border-b pb-2" style={{ color: "var(--text)", borderColor: "var(--border)" }}>
                      {profile.name}
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div className="group">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                    Email Address
                  </label>
                  {editing ? (
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full rounded-lg px-4 py-3 cursor-not-allowed border"
                        style={{
                          background: "var(--surface)",
                          color: "var(--muted)",
                          borderColor: "var(--border)",
                          opacity: 0.7
                        }}
                      />
                      <div className="absolute right-3 top-3" style={{ color: "var(--muted)" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Email address cannot be changed for security reasons.</p>
                    </div>
                  ) : (
                    <div className="text-lg font-medium border-b pb-2 flex items-center gap-2" style={{ color: "var(--text)", borderColor: "var(--border)" }}>
                      {profile.email}
                      <span className="px-2 py-0.5 rounded-full text-xs border bg-green-500/10 text-green-500 border-green-500/20">Verified</span>
                    </div>
                  )}
                </div>

                {/* Role Field */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                    Account Role
                  </label>
                  <div className="flex items-center gap-3">
                    <div className={`
                      inline-flex items-center gap-2 px-4 py-2 rounded-lg border
                      ${profile.role === "OWNER" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" :
                        profile.role === "ADMIN" ? "bg-red-500/10 border-red-500/30 text-red-500" :
                          "bg-green-500/10 border-green-500/30 text-green-500"}
                    `}>
                      <span className="text-lg">
                        {profile.role === "OWNER" ? "👑" : profile.role === "ADMIN" ? "🔧" : "👤"}
                      </span>
                      <span className="font-semibold">{profile.role}</span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {profile.role === "OWNER" ? "Full system access" :
                        profile.role === "ADMIN" ? "Administrative privileges" :
                          "Standard user access"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                {editing && (
                  <div className="flex gap-4 mt-8 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setAvatarFile(null);
                        setAvatarPreview(profile.avatar || null);
                      }}
                      className="flex-1 px-6 py-3 bg-transparent border rounded-xl font-semibold hover:opacity-80 transition-all"
                      style={{ color: "var(--text)", borderColor: "var(--border)" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 px-6 py-3 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ background: "var(--accent)" }}
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .glass-card {
          background: var(--card-bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          border-radius: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }
        
        .fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
          transform: translateY(20px);
          animation-fill-mode: forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(20px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
