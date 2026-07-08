"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/api/admin";
import type { ProductImage } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { normalizeMediaUrl } from "@/lib/media";

interface ImageManagerProps {
  productId: string;
  images: ProductImage[];
  onChange: () => void;
}

export function ImageManager({ productId, images, onChange }: ImageManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await adminApi.images.upload(productId, file, {
        is_primary: images.length === 0,
        alt_text: file.name,
      });
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function setPrimary(id: string) {
    try {
      await adminApi.images.update(id, { is_primary: true });
      onChange();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this image?")) return;
    try {
      await adminApi.images.delete(id);
      onChange();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <section className="admin-section">
      <h2>Images</h2>
      {error ? <p className="error-message">{error}</p> : null}

      <div className="admin-image-grid">
        {images.map((img) => {
          const src = normalizeMediaUrl(img.image);
          return (
            <div key={img.id} className="admin-image-card">
              <div className="admin-image-preview">
                {src ? (
                  <Image src={src} alt={img.alt_text || "Product"} fill className="object-cover" />
                ) : (
                  <div className="product-card-placeholder">No preview</div>
                )}
              </div>
              <div className="admin-image-meta">
                {img.is_primary ? (
                  <span className="status-badge status-confirmed">Primary</span>
                ) : (
                  <Button variant="ghost" onClick={() => setPrimary(img.id)}>
                    Set primary
                  </Button>
                )}
                <Button variant="ghost" onClick={() => handleDelete(img.id)}>
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <label className="admin-upload">
        <span className="input-label">Upload image</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          disabled={uploading}
        />
        {uploading ? <span className="muted">Uploading…</span> : null}
      </label>
    </section>
  );
}
