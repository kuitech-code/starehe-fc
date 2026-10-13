import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchApiList, formatDate, formatTime } from "../api";

function NextMatch() {
  const [fixture, setFixture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchApiList("/api/fixtures", "fixtures")
      .then((data) => {
        if (!cancelled) {
          setFixture(
            data.find(
              (item) => !["Completed", "Cancelled"].includes(item.status)
            ) || null
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
    <section className="next-match">
      <div className="section-container">
        <div className="section-heading">
          <p className="section-eyebrow">NEXT MATCH</p>
          <h2>Matchday is coming.</h2>
        </div>

        {loading ? (
          <p role="status">Loading next match...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : !fixture ? (
          <p>No upcoming fixture has been added yet.</p>
        ) : (
          <div className="match-card">
            <div className="match-team">
              <div className="team-placeholder">S</div>
              <h3>Starehe FC</h3>
              <p>{fixture.is_home ? "Home" : "Away"}</p>
            </div>

            <div className="match-info">
              <span className="match-label">
                {fixture.competition || "UPCOMING MATCH"}
              </span>
              <strong>VS</strong>
              <p>
                {formatDate(fixture.match_date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <p>{formatTime(fixture.kickoff_time)}</p>
            </div>

            <div className="match-team">
              <div className="team-placeholder opponent">
                {fixture.opponent?.charAt(0) || "O"}
              </div>
              <h3>{fixture.opponent}</h3>
              <p>{fixture.is_home ? "Away" : "Home"}</p>
            </div>
          </div>
        )}

        <div className="match-action">
          <Link to="/fixtures" className="dark-button">
            View All Fixtures
          </Link>
        </div>
      </div>
    </section>
  );
}

export default NextMatch;