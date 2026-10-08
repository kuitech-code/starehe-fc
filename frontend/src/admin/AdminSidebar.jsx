import { NavLink } from "react-router-dom";

function AdminSidebar({ menuOpen, closeMenu }) {
  const handleLinkClick = () => {
    if (closeMenu) {
      closeMenu();
    }
  };

  return (
    <>
      {menuOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={closeMenu}
        ></div>
      )}

      <aside
        className={`admin-sidebar ${
          menuOpen ? "open" : ""
        }`}
      >
        <div className="admin-sidebar-header">
          <div>
            <span className="admin-sidebar-label">
              STAREHE FC
            </span>

            <h2>ADMIN</h2>
          </div>

          <button
            type="button"
            className="admin-sidebar-close"
            onClick={closeMenu}
            aria-label="Close admin menu"
          >
            ×
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <NavLink
            to="/admin"
            end
            onClick={handleLinkClick}
          >
            <span>▦</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/fixtures"
            onClick={handleLinkClick}
          >
            <span>◷</span>
            Fixtures
          </NavLink>

          <NavLink
            to="/admin/results"
            onClick={handleLinkClick}
          >
            <span>✓</span>
            Results
          </NavLink>

          <NavLink
            to="/admin/players"
            onClick={handleLinkClick}
          >
            <span>♙</span>
            Players
          </NavLink>

          <NavLink
            to="/admin/news"
            onClick={handleLinkClick}
          >
            <span>▤</span>
            News
          </NavLink>

          <NavLink
            to="/admin/table"
            onClick={handleLinkClick}
          >
            <span>▥</span>
            League Table
          </NavLink>
        </nav>

        <div className="admin-sidebar-bottom">
          <NavLink
            to="/admin/settings"
            onClick={handleLinkClick}
          >
            <span>⚙</span>
            Settings
          </NavLink>

          <button type="button" className="admin-logout">
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;