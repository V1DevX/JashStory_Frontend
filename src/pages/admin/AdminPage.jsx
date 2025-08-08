import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
// import "./AdminPage.css"; // Можно добавить минимальные стили

const AdminPage = () => {
  const location = useLocation();

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "220px",
          background: "#1e1e2f",
          color: "#fff",
          padding: "20px",
        }}
      >
        <h2>Admin Panel</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link
            to="/admin"
            style={{
              color: location.pathname === "/admin" ? "#4cafef" : "#fff",
            }}
          >
            Dashboard
          </Link>
          <Link
            to="/admin/posts"
            style={{
              color: location.pathname.startsWith("/admin/posts") ? "#4cafef" : "#fff",
            }}
          >
            Posts
          </Link>
          <Link
            to="/admin/users"
            style={{
              color: location.pathname.startsWith("/admin/users") ? "#4cafef" : "#fff",
            }}
          >
            Users
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "20px", background: "#f5f5f5" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminPage;
