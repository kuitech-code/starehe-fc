import { useState } from "react";
import { Outlet } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";

function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((current) => !current);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="admin-layout">
      <AdminSidebar
        menuOpen={menuOpen}
        closeMenu={closeMenu}
      />

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-button"
            onClick={toggleMenu}
            aria-label="Open admin menu"
            aria-expanded={menuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className="admin-topbar-title">
            <span>STAREHE FC</span>
            <strong>Admin Panel</strong>
          </div>

          <div className="admin-user">
            <div className="admin-user-avatar">
              A
            </div>

            <div className="admin-user-info">
              <strong>Administrator</strong>
              <span>Club Admin</span>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;