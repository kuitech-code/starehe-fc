import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroImage from "../assets/test-bg.jpg";
import { fetchApiList, formatDate, formatTime } from "../api";

function Hero() {
  const [fixture, setFixture] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchApiList("/api/fixtures", "fixtures")
      .then((fixtures) => {
        if (!cancelled) {
          setFixture(
            fixtures.find((item) => !["Completed", "Cancelled"].includes(item.status)) || null
          );
        }
      })
      .catch(() => {
        if (!cancelled) setFixture(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="hero">
      <img className="hero-photo" src={heroImage} alt="Football resting on the pitch" />
      <div className="hero-content">
        <div className="hero-copy">
          <p className="hero-eyebrow">NDARAGWA · NYANDARUA · KENYA</p>
          <h1>
            ONE CLUB
            <br />
            <span>ONE FAMILY</span>
            <br />
            ONE DREAM
          </h1>
          <p className="hero-text">
            Starehe FC brings people together through the passion and pride of football.
          </p>
          <div className="hero-actions">
            <Link to="/fixtures" className="hero-button hero-button-primary">View Fixtures</Link>
            <Link to="/about" className="hero-button hero-button-secondary">About the Club</Link>
          </div>
        </div>

        <aside className="hero-match-card" aria-label="Next match">
          <p className="hero-card-label">NEXT MATCH</p>
          {fixture ? (
            <>
              <h2>{fixture.is_home ? "Starehe FC" : fixture.opponent} <span>vs</span> {fixture.is_home ? fixture.opponent : "Starehe FC"}</h2>
              <p>{formatDate(fixture.match_date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
              <p>{formatTime(fixture.kickoff_time)}{fixture.venue ? ` · ${fixture.venue}` : ""}</p>
            </>
          ) : (
            <>
              <h2>Matchday is coming.</h2>
              <p>Upcoming fixture details will appear here.</p>
            </>
          )}
          <Link to="/fixtures" className="hero-card-link">MATCH DETAILS <span aria-hidden="true">→</span></Link>
        </aside>
      </div>
    </section>
  );
}

export default Hero;
