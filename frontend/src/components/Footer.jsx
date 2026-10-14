import { Link } from "react-router-dom";
import clubLogo from "../assets/starehe-fc-logo.png";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-container">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src={clubLogo} alt="" aria-hidden="true" />
              <span>STAREHE FC</span>
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
            © {new Date().getFullYear()} Starehe FC. All rights reserved.
          </p>

          <p>
            <a href="https://wa.me/254741194959?text=Hello%20KuiTech%2C%20I%20would%20like%20to%20inquire%20about%20website%20development%20services." target="_blank" rel="noopener noreferrer" className="footer-link">
               Built with passion by KuiTech
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
