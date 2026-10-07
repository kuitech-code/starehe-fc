import { useState } from "react";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <a href="/" className="navbar-logo" onClick={closeMenu}>
          STAREHE FC
        </a>

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
            <a href="/" onClick={closeMenu}>Home</a>
            <a href="/fixtures" onClick={closeMenu}>Fixtures</a>
            <a href="/results" onClick={closeMenu}>Results</a>
            <a href="/table" onClick={closeMenu}>Table</a>
            <a href="/team" onClick={closeMenu}>Team</a>
            <a href="/news" onClick={closeMenu}>News</a>
            <a href="/about" onClick={closeMenu}>About</a>
          </nav>

          <a href="/contact" className="navbar-button" onClick={closeMenu}>
            Contact
          </a>
        </div>
      </div>
    </header>
  );
}

export default Navbar;