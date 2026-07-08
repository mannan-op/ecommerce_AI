"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import {
  fetchAdminCSRQueue,
  updateAdminCSRHandoff,
  type CSRHandoff,
} from "@/lib/api/tryon";
import { normalizeMediaUrl } from "@/lib/media";

const STATUS_OPTIONS = ["pending", "contacted", "resolved"] as const;

export default function AdminTryOnPage() {
  const [items, setItems] = useState<CSRHandoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminCSRQueue();
      setItems(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: CSRHandoff["status"]) {
    setSavingId(id);
    try {
      const updated = await updateAdminCSRHandoff(id, { status });
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } finally {
      setSavingId(null);
    }
  }

  async function saveNotes(id: string, staff_notes: string) {
    setSavingId(id);
    try {
      const updated = await updateAdminCSRHandoff(id, { staff_notes });
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <p className="admin-muted">Loading stylist queue…</p>;
  }

  if (error) {
    return (
      <div>
        <p className="admin-error">{error}</p>
        <button type="button" className="admin-btn" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <header className="admin-page-header">
        <div>
          <h1>Stylist handoffs</h1>
          <p className="admin-muted">
            Customer try-on requests waiting for personal styling follow-up.
          </p>
        </div>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={load}>
          Refresh
        </button>
      </header>

      {items.length === 0 ? (
        <p className="admin-muted">No stylist requests yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Message</th>
                <th>Preview</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const imageUrl = normalizeMediaUrl(item.result_image);
                return (
                  <tr key={item.id}>
                    <td>
                      <div>{item.user_email ?? item.contact_email}</div>
                      <div className="admin-muted text-xs">{item.preferred_channel}</div>
                    </td>
                    <td>{item.product_name}</td>
                    <td className="max-w-xs">{item.message}</td>
                    <td>
                      {imageUrl ? (
                        <div className="relative h-20 w-14 overflow-hidden rounded admin-thumb">
                          <Image
                            src={imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <select
                        className="admin-input"
                        value={item.status}
                        disabled={savingId === item.id}
                        onChange={(e) =>
                          updateStatus(item.id, e.target.value as CSRHandoff["status"])
                        }
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <textarea
                        className="admin-input min-h-[72px] w-full"
                        defaultValue={item.staff_notes}
                        disabled={savingId === item.id}
                        onBlur={(e) => {
                          if (e.target.value !== item.staff_notes) {
                            saveNotes(item.id, e.target.value);
                          }
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
