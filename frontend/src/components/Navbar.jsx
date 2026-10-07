import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">

        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          STAREHE FC
        </Link>

        <button
          className="navbar-toggle"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${menuOpen ? "open" : ""}`}>

          <nav className="navbar-links">

            <Link to="/" onClick={closeMenu}>
              Home
            </Link>

            <Link to="/fixtures" onClick={closeMenu}>
              Fixtures
            </Link>

            <Link to="/results" onClick={closeMenu}>
              Results
            </Link>

            <Link to="/table" onClick={closeMenu}>
              Table
            </Link>

            <Link to="/team" onClick={closeMenu}>
              Team
            </Link>

            <Link to="/news" onClick={closeMenu}>
              News
            </Link>

            <Link to="/about" onClick={closeMenu}>
              About
            </Link>

          </nav>

          <Link
            to="/contact"
            className="navbar-button"
            onClick={closeMenu}
          >
            Contact
          </Link>

        </div>
      </div>
    </header>
  );
}

export default Navbar;
