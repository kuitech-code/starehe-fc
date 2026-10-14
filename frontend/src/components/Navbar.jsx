import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import clubLogo from "../assets/starehe-fc-logo.png";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">

        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <img src={clubLogo} alt="" aria-hidden="true" />
          <span>STAREHE FC</span>
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

            <NavLink to="/" end onClick={closeMenu}>
              Home
            </NavLink>

            <NavLink to="/fixtures" onClick={closeMenu}>
              Fixtures
            </NavLink>

            <NavLink to="/results" onClick={closeMenu}>
              Results
            </NavLink>

            <NavLink to="/table" onClick={closeMenu}>
              Table
            </NavLink>

            <NavLink to="/team" onClick={closeMenu}>
              Team
            </NavLink>

            <NavLink to="/news" onClick={closeMenu}>
              News
            </NavLink>

            <NavLink to="/about" onClick={closeMenu}>
              About
            </NavLink>

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
