import { useEffect, useState } from "react";
import { fetchApiList, formatDate, formatTime } from "../api";

function Fixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchApiList("/api/fixtures", "fixtures")
      .then((data) => {
        if (!cancelled) {
          setFixtures(
            data.filter(
              (item) => !["Completed", "Cancelled"].includes(item.status)
            )
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
    <main className="fixtures-page">
      <section className="page-hero">
        <div className="section-container">
          <p className="section-eyebrow">STAREHE FC</p>
          <h1>Fixtures</h1>
          <p>Follow Starehe FC through every matchday.</p>
        </div>
      </section>

      <section className="fixtures-page-content">
        <div className="section-container">
          <div className="fixtures-page-heading">
            <div>
              <p className="section-eyebrow">UPCOMING MATCHES</p>
              <h2>What's next?</h2>
            </div>
          </div>

          {loading ? (
            <p role="status">Loading fixtures...</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : fixtures.length === 0 ? (
            <p>No upcoming fixtures have been added yet.</p>
          ) : (
            <div className="fixtures-page-list">
              {fixtures.map((fixture) => (
                <article className="fixture-full-card" key={fixture.id}>
                  <div className="fixture-full-date">
                    <span>
                      {formatDate(fixture.match_date, { weekday: "long" })}
                    </span>
                    <strong>{formatDate(fixture.match_date)}</strong>
                    <small>{formatTime(fixture.kickoff_time)}</small>
                  </div>

                  <div className="fixture-full-match">
                    <div className="fixture-full-team">
                      <div className="full-team-placeholder">S</div>
                      <strong>Starehe FC</strong>
                      <span>{fixture.is_home ? "HOME" : "AWAY"}</span>
                    </div>

                    <div className="fixture-full-vs">
                      <small>
                        {fixture.competition || "Match"}
                        {fixture.status && fixture.status !== "Scheduled"
                          ? ` · ${fixture.status}`
                          : ""}
                      </small>
                      <strong>VS</strong>
                    </div>

                    <div className="fixture-full-team">
                      <div className="full-team-placeholder opponent">
                        {fixture.opponent?.charAt(0) || "O"}
                      </div>
                      <strong>{fixture.opponent}</strong>
                      <span>{fixture.is_home ? "AWAY" : "HOME"}</span>
                    </div>
                  </div>

                  <div className="fixture-full-venue">
                    <span>VENUE</span>
                    <strong>{fixture.venue || "Venue to be confirmed"}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Fixtures;