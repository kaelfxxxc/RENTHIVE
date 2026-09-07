import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ShieldCheck, ShieldX, UserX, UserCheck } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Avatar } from "../../components/ui/Avatar";
import { Badge, statusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import type { Profile } from "../../types";

export default function AdminUsersPage() {
  const { success, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  // Seeded from ?q= so the admin header search lands on a filtered list.
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { load(); }, []);

  // Follow later ?q= changes (e.g. a second search from the header while
  // already on this page).
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearch(q);
  }, [searchParams]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers((data as Profile[]) || []);
    setLoading(false);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    // Keep the URL honest without stacking history entries per keystroke.
    const next = new URLSearchParams(searchParams);
    if (value) next.set("q", value);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const updateVerification = async (userId: string, status: string) => {
    setProcessing(true);
    const { error } = await db.from("profiles").update({ verification_status: status }).eq("id", userId);
    if (error) toastError("Failed", error.message);
    else {
      success("Verification status updated");
      setUsers(u => u.map(x => x.id === userId ? { ...x, verification_status: status as Profile["verification_status"] } : x));
      setSelectedUser(prev => prev?.id === userId ? { ...prev, verification_status: status as Profile["verification_status"] } : prev);
    }
    setProcessing(false);
  };

  const toggleActive = async (user: Profile) => {
    setProcessing(true);
    const { error } = await db.from("profiles").update({ is_active: !user.is_active }).eq("id", user.id);
    if (error) toastError("Failed", error.message);
    else {
      success(user.is_active ? "User suspended" : "User reactivated");
      setUsers(u => u.map(x => x.id === user.id ? { ...x, is_active: !user.is_active } : x));
      setSelectedUser(null);
    }
    setProcessing(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Users</h1>
          <span className="text-sm text-[var(--muted-foreground)]">{filtered.length} users</span>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 bg-white border border-[var(--border)] rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-[var(--muted-foreground)]" />
            <input value={search} onChange={e => handleSearchChange(e.target.value)} placeholder="Search by name or email…" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border border-[var(--border)] bg-white rounded-xl px-3 py-2 text-sm outline-none">
            <option value="">All Roles</option>
            <option value="renter">Renters</option>
            <option value="lessor">Lessors</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {loading ? <TableSkeleton /> : (
          <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)] border-b border-[var(--border)]">
                <tr>
                  {["User", "Role", "Verification", "Status", "Joined", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} className={`border-b border-[var(--border)] hover:bg-[var(--muted)] transition-colors ${i === filtered.length - 1 ? "border-b-0" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={u.avatar_url} name={u.full_name} size="sm" />
                        <div>
                          <p className="font-medium">{u.full_name || "Unknown"}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{statusBadge(u.role)}</td>
                    <td className="px-4 py-3">{statusBadge(u.verification_status)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.is_active ? "success" : "danger"}>{u.is_active ? "Active" : "Suspended"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="xs" onClick={() => setSelectedUser(u)}>Manage</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center text-sm text-[var(--muted-foreground)] py-8">No users found</p>}
          </div>
        )}
      </div>

      {selectedUser && (
        <Modal open title={`Manage: ${selectedUser.full_name}`} onClose={() => setSelectedUser(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar src={selectedUser.avatar_url} name={selectedUser.full_name} size="lg" />
              <div>
                <p className="font-bold">{selectedUser.full_name}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{selectedUser.email}</p>
                <div className="flex gap-2 mt-1">{statusBadge(selectedUser.role)}{statusBadge(selectedUser.verification_status)}</div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Identity Verification</p>
              <div className="flex flex-wrap gap-2">
                <Button size="xs" variant="accent" icon={<ShieldCheck className="w-3.5 h-3.5" />} loading={processing} onClick={() => updateVerification(selectedUser.id, "verified")}>Verify</Button>
                <Button size="xs" variant="danger" icon={<ShieldX className="w-3.5 h-3.5" />} loading={processing} onClick={() => updateVerification(selectedUser.id, "rejected")}>Reject</Button>
                <Button size="xs" variant="secondary" loading={processing} onClick={() => updateVerification(selectedUser.id, "under_review")}>Mark Under Review</Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Account Status</p>
              <Button size="sm" variant={selectedUser.is_active ? "danger" : "accent"} icon={selectedUser.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />} loading={processing} onClick={() => toggleActive(selectedUser)}>
                {selectedUser.is_active ? "Suspend Account" : "Reactivate Account"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
