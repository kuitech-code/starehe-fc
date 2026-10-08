import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-container">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              STAREHE FC
            </Link>

            <p>
              One club. One family. One dream.
              Football, community and ambition.
            </p>
          </div>

          <div className="footer-column">
            <h3>Club</h3>

            <Link to="/about">About</Link>
            <Link to="/team">Team</Link>
            <Link to="/news">News</Link>
            <Link to="/contact">Contact</Link>
          </div>

          <div className="footer-column">
            <h3>Matchday</h3>

            <Link to="/fixtures">Fixtures</Link>
            <Link to="/results">Results</Link>
            <Link to="/table">League Table</Link>
          </div>

          <div className="footer-column">
            <h3>Follow Us</h3>

            <a href="#" aria-label="Facebook">
              Facebook
            </a>

            <a href="#" aria-label="Instagram">
              Instagram
            </a>

            <a href="#" aria-label="X">
              X
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container footer-bottom-inner">
          <p>
            © 2026 Starehe FC. All rights reserved.
          </p>

          <p>
            Built with passion for football.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;