import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <p className="hero-eyebrow">WELCOME TO STAREHE FC</p>

        <h1>
          ONE CLUB.
          <br />
          ONE FAMILY.
          <br />
          ONE DREAM.
        </h1>

        <p className="hero-text">
          Passion. Pride. Football.
        </p>

        <div className="hero-actions">
          <Link
            to="/fixtures"
            className="hero-button hero-button-primary"
          >
            View Fixtures
          </Link>

          <Link
            to="/team"
            className="hero-button hero-button-secondary"
          >
            Meet The Team
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Hero;