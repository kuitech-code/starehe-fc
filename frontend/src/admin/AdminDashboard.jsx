import { useEffect, useState } from "react";
import {
  fetchApiList,
  formatDate,
  formatTime,
  resultLetter,
} from "../api";

function todayAsISODate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function AdminDashboard() {
  const [data, setData] = useState({
    players: [],
    fixtures: [],
    results: [],
    news: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchApiList("/api/players", "players"),
      fetchApiList("/api/fixtures", "fixtures"),
      fetchApiList("/api/results", "results"),
      fetchApiList("/api/news/published", "news"),
    ])
      .then(([players, fixtures, results, news]) => {
        if (!cancelled) {
          setData({ players, fixtures, results, news });
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

  const today = todayAsISODate();

  const activePlayers = data.players.filter(
    (player) => player.is_active !== false
  );

  const upcomingFixtures = data.fixtures.filter(
    (fixture) =>
      fixture.match_date >= today &&
      !["Completed", "Cancelled"].includes(fixture.status)
  );

  const nextFixture = upcomingFixtures[0] || null;
  const latestResult = data.results[0] || null;

  const stats = [
    {
      label: "Players",
      value: loading ? "…" : activePlayers.length,
      description: "Active squad",
    },
    {
      label: "Fixtures",
      value: loading ? "…" : upcomingFixtures.length,
      description: "Upcoming matches",
    },
    {
      label: "Results",
      value: loading ? "…" : data.results.length,
      description: "Recorded results",
    },
    {
      label: "News",
      value: loading ? "…" : data.news.length,
      description: "Published stories",
    },
  ];

  const latestOutcome = latestResult ? resultLetter(latestResult) : "";

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">OVERVIEW</p>
          <h1>Dashboard</h1>
          <p>Welcome back. Here's what's happening around Starehe FC.</p>
        </div>
      </div>

      {error && <p role="alert">{error}</p>}

      <section className="admin-stats-grid">
        {stats.map((stat) => (
          <article className="admin-stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <p>{stat.description}</p>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-panel-card">
          <div className="admin-panel-header">
            <div>
              <p className="admin-eyebrow">UPCOMING</p>
              <h2>Next Fixture</h2>
            </div>

            {nextFixture && (
              <span className="admin-status">
                {nextFixture.status || "UPCOMING"}
              </span>
            )}
          </div>

          {loading ? (
            <p role="status">Loading fixture...</p>
          ) : nextFixture ? (
            <div className="admin-next-match">
              <div>
                <span>STAREHE FC</span>
                <strong>VS</strong>
                <span>{nextFixture.opponent}</span>
              </div>

              <p>
                {formatDate(nextFixture.match_date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {" · "}
                {formatTime(nextFixture.kickoff_time)}
              </p>

              <small>
                {nextFixture.venue || "Venue to be confirmed"}
                {nextFixture.competition
                  ? ` · ${nextFixture.competition}`
                  : ""}
              </small>
            </div>
          ) : (
            <p>No upcoming fixtures have been added.</p>
          )}
        </article>

        <article className="admin-panel-card">
          <div className="admin-panel-header">
            <div>
              <p className="admin-eyebrow">RECENT</p>
              <h2>Latest Result</h2>
            </div>

            {latestResult && (
              <span
                className={
                  latestOutcome === "W" ? "admin-result-win" : "admin-status"
                }
              >
                {latestOutcome === "W"
                  ? "WIN"
                  : latestOutcome === "D"
                    ? "DRAW"
                    : "LOSS"}
              </span>
            )}
          </div>

          {loading ? (
            <p role="status">Loading result...</p>
          ) : latestResult ? (
            <>
              <div className="admin-latest-result">
                <span>STAREHE FC</span>
                <strong>
                  {latestResult.starehe_score} - {latestResult.opponent_score}
                </strong>
                <span>{latestResult.opponent}</span>
              </div>

              <p className="admin-result-date">
                {formatDate(latestResult.match_date, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {latestResult.competition
                  ? ` · ${latestResult.competition}`
                  : ""}
              </p>
            </>
          ) : (
            <p>No results have been recorded.</p>
          )}
        </article>
      </section>

      <section className="admin-panel-card admin-activity-card">
        <div className="admin-panel-header">
          <div>
            <p className="admin-eyebrow">QUICK OVERVIEW</p>
            <h2>Club Activity</h2>
          </div>
        </div>

        {loading ? (
          <p role="status">Loading club activity...</p>
        ) : (
          <div className="admin-activity-list">
            <div>
              <span className="activity-dot"></span>
              <p>
                <strong>{upcomingFixtures.length} fixtures</strong>{" "}
                scheduled.
              </p>
            </div>

            <div>
              <span className="activity-dot"></span>
              <p>
                <strong>{activePlayers.length} players</strong> in the active
                squad.
              </p>
            </div>

            <div>
              <span className="activity-dot"></span>
              <p>
                <strong>{data.news.length} news stories</strong> published.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;