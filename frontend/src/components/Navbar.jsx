function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <a href="/" className="navbar-logo">
          STAREHE FC
        </a>

        <nav className="navbar-links">
          <a href="/">Home</a>
          <a href="/fixtures">Fixtures</a>
          <a href="/results">Results</a>
          <a href="/table">Table</a>
          <a href="/team">Team</a>
          <a href="/news">News</a>
          <a href="/about">About</a>
        </nav>

        <a href="/contact" className="navbar-button">
          Contact
        </a>
      </div>
    </header>
  );
}

export default Navbar;