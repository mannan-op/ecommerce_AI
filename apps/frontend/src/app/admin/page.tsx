import Link from "next/link";

import { Button } from "@/components/ui/Button";

export default function AdminDashboardPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Dashboard</h1>
        <p className="muted">Manage your catalog and storefront content.</p>
      </header>

      <div className="admin-cards">
        <Link href="/admin/products" className="admin-card">
          <h2>Products</h2>
          <p>Create, edit, and upload images for products and variants.</p>
          <Button variant="secondary">Manage products</Button>
        </Link>
        <Link href="/admin/categories" className="admin-card">
          <h2>Categories</h2>
          <p>Organize products into browsable categories.</p>
          <Button variant="secondary">Manage categories</Button>
        </Link>
      </div>
    </div>
  );
}
