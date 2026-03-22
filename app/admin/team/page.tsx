"use client";

import { useState, useEffect } from "react";

interface TeamMember {
  username: string;
  role: "owner" | "editor" | "viewer";
  createdAt?: string;
}

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-red-500/20 text-red-400 border-red-500/30",
  editor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  viewer: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "Full access — can manage team, inventory, orders, and settings",
  editor: "Can add/edit/delete inventory and manage orders",
  viewer: "Read-only access to dashboard and inventory",
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);

  // Add form state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"owner" | "editor" | "viewer">("editor");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Edit form state
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"owner" | "editor" | "viewer">("editor");

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/admin/team");
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormSuccess(`Team member "${newUsername}" added successfully`);
        setNewUsername("");
        setNewPassword("");
        setNewRole("editor");
        setShowAdd(false);
        fetchMembers();
      } else {
        setFormError(data.error);
      }
    } catch {
      setFormError("Failed to add team member");
    }
  };

  const handleUpdate = async (username: string) => {
    setFormError("");
    try {
      const body: Record<string, string> = { username };
      if (editPassword) body.password = editPassword;
      if (editRole) body.role = editRole;

      const res = await fetch("/api/admin/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setFormSuccess(`Updated "${username}" successfully`);
        setEditingUser(null);
        setEditPassword("");
        fetchMembers();
      } else {
        setFormError(data.error);
      }
    } catch {
      setFormError("Failed to update team member");
    }
  };

  const handleDelete = async (username: string) => {
    if (!confirm(`Remove team member "${username}"? They will lose access immediately.`)) return;

    try {
      const res = await fetch(`/api/admin/team?username=${encodeURIComponent(username)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setFormSuccess(`Removed "${username}" from the team`);
        fetchMembers();
      } else {
        setFormError(data.error);
      }
    } catch {
      setFormError("Failed to remove team member");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)]">Team Members</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Manage who has access to the admin panel
          </p>
        </div>
        <button
          onClick={() => {
            setShowAdd(!showAdd);
            setFormError("");
            setFormSuccess("");
          }}
          className="px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          {showAdd ? "Cancel" : "+ Add Member"}
        </button>
      </div>

      {/* Messages */}
      {formError && (
        <div className="mb-4 p-3 rounded-[var(--radius)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-sm">
          {formError}
        </div>
      )}
      {formSuccess && (
        <div className="mb-4 p-3 rounded-[var(--radius)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[var(--color-success)] text-sm">
          {formSuccess}
        </div>
      )}

      {/* Add member form */}
      {showAdd && (
        <div className="mb-6 p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">Add New Team Member</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  minLength={3}
                  placeholder="e.g. john"
                  className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "owner" | "editor" | "viewer")}
                  className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              {ROLE_DESCRIPTIONS[newRole]}
            </p>
            <button
              type="submit"
              className="px-4 py-2 rounded-[var(--radius)] bg-[var(--color-success)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Create Account
            </button>
          </form>
        </div>
      )}

      {/* Team members list */}
      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.username}
            className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-card)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-lg">
                  {member.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-text)]">{member.username}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${ROLE_COLORS[member.role]}`}>
                      {member.role}
                    </span>
                    {member.createdAt && (
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        Added {member.createdAt}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (editingUser === member.username) {
                      setEditingUser(null);
                    } else {
                      setEditingUser(member.username);
                      setEditRole(member.role);
                      setEditPassword("");
                    }
                  }}
                  className="px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
                >
                  {editingUser === member.username ? "Cancel" : "Edit"}
                </button>
                <button
                  onClick={() => handleDelete(member.username)}
                  className="px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Edit form */}
            {editingUser === member.username && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
                      New Password (leave empty to keep current)
                    </label>
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Role</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as "owner" | "editor" | "viewer")}
                      className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-3">
                  {ROLE_DESCRIPTIONS[editRole]}
                </p>
                <button
                  onClick={() => handleUpdate(member.username)}
                  className="px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
