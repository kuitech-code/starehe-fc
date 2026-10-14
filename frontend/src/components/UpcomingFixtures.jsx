import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchApiList, formatDate, formatTime } from "../api";
import ClubBadge from "./ClubBadge";

function UpcomingFixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchApiList("/api/fixtures", "fixtures")
      .then((data) => {
        if (!cancelled) {
          setFixtures(
            data
              .filter(
                (item) => !["Completed", "Cancelled"].includes(item.status)
              )
              .slice(0, 3)
          );
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="fixtures-section">
      <div className="section-container">
        <div className="results-header">
          <div className="section-heading">
            <p className="section-eyebrow">UPCOMING FIXTURES</p>
            <h2>What's next?</h2>
          </div>
          <Link to="/fixtures" className="results-link">
            View All Fixtures →
          </Link>
        </div>

        {loading ? (
          <p role="status">Loading fixtures...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : fixtures.length === 0 ? (
          <p>No upcoming fixtures have been added yet.</p>
        ) : (
          <div className="fixtures-grid">
            {fixtures.map((fixture) => (
              <article className="fixture-card" key={fixture.id}>
                <div className="fixture-date">
                  <strong>{formatDate(fixture.match_date)}</strong>
                  <span>{formatTime(fixture.kickoff_time)}</span>
                </div>

                <div className="fixture-match">
                  <div className="fixture-team">
                    <ClubBadge name="Starehe FC" size="small" />
                    <strong>Starehe FC</strong>
                  </div>

                  <span className="fixture-vs">VS</span>

                  <div className="fixture-team">
                    <ClubBadge src={fixture.opponent_logo_url} name={fixture.opponent} size="small" />
                    <strong>{fixture.opponent}</strong>
                  </div>
                </div>

                <div className="fixture-details">
                  <span>{fixture.is_home ? "HOME" : "AWAY"}</span>
                  <p>{fixture.venue || "Venue to be confirmed"}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default UpcomingFixtures;
