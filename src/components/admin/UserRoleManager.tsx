"use client";

import { useState } from "react";
import { 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  User, 
  Building2, 
  ChevronDown, 
  Check, 
  Loader2, 
  AlertCircle,
  PlusCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
}

interface UserRoleManagerProps {
  initialUsers: Profile[];
  currentUserId: string;
}

export default function UserRoleManager({ initialUsers, currentUserId }: UserRoleManagerProps) {
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [roleToPromote, setRoleToPromote] = useState("admin");
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [searchTargetId, setSearchTargetId] = useState("");
  const supabase = createClient();

  const filteredUsers = users.filter((u) => {
    const searchString = `${u.full_name || ""} ${u.role || ""} ${u.phone || ""}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  async function handleRoleUpdate(userId: string, newRole: string) {
    setUpdatingId(userId);
    setSuccessMsg(null);
    setErrorMsg(null);
    setOpenDropdownId(null);

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      setErrorMsg(`Failed to update role: ${error.message}`);
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setSuccessMsg("User role updated and synchronized successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    }
    setUpdatingId(null);
  }

  function getRoleBadge(role: string | null) {
    switch (role) {
      case "super_admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 border border-purple-200 text-purple-700">
            <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
          </span>
        );
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
            <ShieldAlert className="w-3.5 h-3.5" /> Admin
          </span>
        );
      case "vendor":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700">
            <Building2 className="w-3.5 h-3.5" /> Vendor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 border border-zinc-200 text-zinc-650">
            <User className="w-3.5 h-3.5" /> Regular User
          </span>
        );
    }
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2.5 text-sm text-green-700 font-semibold shadow-sm animate-in fade-in duration-200">
          <Check className="w-5 h-5 text-green-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2.5 text-sm text-red-700 font-semibold shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Control Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, or current role..."
            className="w-full bg-white border border-[#E8EBE7] rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm text-zinc-800 placeholder:text-zinc-400 font-medium"
          />
        </div>

        {/* Promotion Trigger */}
        <button
          onClick={() => setShowPromoteModal(true)}
          className="w-full md:w-auto px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          Promote Super Admin by ID
        </button>
      </div>

      {/* Users Database Table */}
      <div className="glass-card bg-white border border-[#E8EBE7] shadow-sm rounded-2xl overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-zinc-500 space-y-2">
            <User className="w-12 h-12 text-zinc-300 mx-auto" />
            <p className="font-bold text-zinc-700">No matching platform users found</p>
            <p className="text-zinc-500 text-sm">Refine your search parameters or promote a user manually by ID.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E8EBE7] bg-zinc-50/50">
                  <th className="p-4 font-bold text-zinc-650">User Profile Name</th>
                  <th className="p-4 font-bold text-zinc-650">Database Reference ID</th>
                  <th className="p-4 font-bold text-zinc-650">Telephone Number</th>
                  <th className="p-4 font-bold text-zinc-650">Platform Role</th>
                  <th className="p-4 font-bold text-zinc-650 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EBE7]">
                {filteredUsers.map((profile) => (
                  <tr key={profile.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="p-4 font-bold text-zinc-800">
                      {profile.full_name || "Anonymous Member"}
                    </td>
                    <td className="p-4 text-xs font-mono text-zinc-400 select-all font-semibold">
                      {profile.id}
                    </td>
                    <td className="p-4 text-zinc-500 font-medium">
                      {profile.phone || "Not provided"}
                    </td>
                    <td className="p-4">
                      {getRoleBadge(profile.role)}
                    </td>
                    <td className="p-4 text-right relative">
                      {updatingId === profile.id ? (
                        <div className="flex justify-end p-2">
                          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                        </div>
                      ) : (
                        <div className="inline-block text-left">
                          {profile.id === currentUserId ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-55/10 text-zinc-400 text-xs font-bold select-none cursor-not-allowed">
                              Active Admin Session
                            </span>
                          ) : (
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === profile.id ? null : profile.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-indigo-300 hover:text-indigo-600 text-xs font-bold text-zinc-700 bg-white transition-all cursor-pointer"
                            >
                              Assign Role <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {openDropdownId === profile.id && (
                            <div className="absolute right-4 mt-2 w-48 rounded-xl bg-white border border-zinc-200 shadow-xl z-20 overflow-hidden py-1 animate-in fade-in duration-100">
                              <button
                                onClick={() => handleRoleUpdate(profile.id, "user")}
                                className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-zinc-50 text-zinc-700 flex items-center justify-between"
                              >
                                <span>Regular User</span>
                                {profile.role === "user" && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                              </button>
                              <button
                                onClick={() => handleRoleUpdate(profile.id, "vendor")}
                                className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-zinc-50 text-zinc-700 flex items-center justify-between"
                              >
                                <span>Vendor / Organizer</span>
                                {profile.role === "vendor" && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                              </button>
                              <button
                                onClick={() => handleRoleUpdate(profile.id, "admin")}
                                className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-zinc-50 text-zinc-700 flex items-center justify-between"
                              >
                                <span>System Admin</span>
                                {profile.role === "admin" && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                              </button>
                              <button
                                onClick={() => handleRoleUpdate(profile.id, "super_admin")}
                                className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-zinc-50 text-zinc-700 flex items-center justify-between"
                              >
                                <span>Super Admin</span>
                                {profile.role === "super_admin" && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Promotion Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-zinc-200 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-zinc-800 mb-2">Promote User Manually</h3>
            <p className="text-zinc-500 text-sm mb-4">
              Directly assign administrative authority to a user using their exact database reference ID.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Target User Reference ID (UUID)</label>
                <input
                  type="text"
                  value={searchTargetId}
                  onChange={(e) => setSearchTargetId(e.target.value)}
                  placeholder="e.g. 6fd4bb59-7e67-4873-a252-17f919b2d795"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:border-indigo-500 text-sm font-semibold font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Target Promotion Role</label>
                <select
                  value={roleToPromote}
                  onChange={(e) => setRoleToPromote(e.target.value)}
                  title="Target Promotion Role"
                  aria-label="Target Promotion Role"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:border-indigo-500 text-sm font-bold bg-white"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">System Admin</option>
                  <option value="vendor">Vendor / Organizer</option>
                  <option value="user">Regular User</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowPromoteModal(false);
                  setSearchTargetId("");
                }}
                className="flex-1 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!searchTargetId.trim()) return;
                  await handleRoleUpdate(searchTargetId.trim(), roleToPromote);
                  setShowPromoteModal(false);
                  setSearchTargetId("");
                }}
                disabled={!searchTargetId.trim()}
                className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5"
              >
                Promote User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
