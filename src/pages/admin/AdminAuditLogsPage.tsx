import { useState, useEffect } from "react";
import { FileText, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableSkeleton } from "../../components/ui/Skeleton";

interface LogRow {
  id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  changed_by: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
  actor: { full_name: string | null; email: string | null } | null;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("audit_logs")
      .select("id,action,table_name,record_id,changed_by,changes,created_at,actor:profiles!audit_logs_changed_by_fkey(full_name,email)")
      .order("created_at", { ascending: false })
      .limit(200);
    setLogs((data as unknown as LogRow[]) || []);
    setLoading(false);
  };

  const filtered = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.action.toLowerCase().includes(q) || l.table_name.toLowerCase().includes(q) || l.actor?.full_name?.toLowerCase().includes(q) || l.actor?.email?.toLowerCase().includes(q);
  });

  const actionColor = (action: string) => {
    if (action === "INSERT") return "bg-green-100 text-green-700";
    if (action === "UPDATE") return "bg-amber-100 text-amber-700";
    if (action === "DELETE") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Audit Logs</h1>
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={load}>Refresh</Button>
        </div>

        <Input placeholder="Search by action, table, or user..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

        {loading ? <TableSkeleton /> : filtered.length === 0 ? (
          <EmptyState icon={<FileText className="w-8 h-8" />} title="No audit logs" description="Database changes are logged here." />
        ) : (
          <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <tr>
                    {["Action", "Table", "Record ID", "Actor", "Timestamp", "Changes"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filtered.map(l => (
                    <>
                      <tr key={l.id} className="hover:bg-[var(--muted)] transition-colors cursor-pointer" onClick={() => setExpanded(expanded === l.id ? null : l.id)}>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold font-mono ${actionColor(l.action)}`}>{l.action}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{l.table_name}</td>
                        <td className="px-4 py-3 font-mono text-xs max-w-[100px] truncate">{l.record_id ? l.record_id.slice(0, 8) + "..." : "—"}</td>
                        <td className="px-4 py-3">{l.actor?.full_name || l.actor?.email || "System"}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-[var(--muted-foreground)]">{new Date(l.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          {l.changes && <span className="text-xs text-[var(--primary)] underline cursor-pointer">{expanded === l.id ? "Hide" : "Show"}</span>}
                        </td>
                      </tr>
                      {expanded === l.id && l.changes && (
                        <tr key={`${l.id}-detail`}>
                          <td colSpan={6} className="px-4 py-3 bg-slate-50">
                            <pre className="text-xs font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(l.changes, null, 2)}</pre>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
