function AdminDashboard() {
  const stats = [
    {
      label: "Players",
      value: "13",
      description: "Registered squad",
    },
    {
      label: "Fixtures",
      value: "4",
      description: "Upcoming matches",
    },
    {
      label: "Results",
      value: "4",
      description: "Recorded results",
    },
    {
      label: "News",
      value: "6",
      description: "Published stories",
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">
            OVERVIEW
          </p>

          <h1>Dashboard</h1>

          <p>
            Welcome back. Here's what's happening
            around Starehe FC.
          </p>
        </div>
      </div>

      <section className="admin-stats-grid">
        {stats.map((stat) => (
          <article
            className="admin-stat-card"
            key={stat.label}
          >
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
              <p className="admin-eyebrow">
                UPCOMING
              </p>

              <h2>Next Fixture</h2>
            </div>

            <span className="admin-status">
              UPCOMING
            </span>
          </div>

          <div className="admin-next-match">
            <div>
              <span>STAREHE FC</span>
              <strong>VS</strong>
              <span>MURAI FC</span>
            </div>

            <p>
              Sunday, 18 October 2026 · 3:00 PM
            </p>

            <small>
              Starehe Grounds · League Match
            </small>
          </div>
        </article>

        <article className="admin-panel-card">
          <div className="admin-panel-header">
            <div>
              <p className="admin-eyebrow">
                RECENT
              </p>

              <h2>Latest Result</h2>
            </div>

            <span className="admin-result-win">
              WIN
            </span>
          </div>

          <div className="admin-latest-result">
            <span>STAREHE FC</span>

            <strong>3 - 1</strong>

            <span>MURAI FC</span>
          </div>

          <p className="admin-result-date">
            12 October 2026 · League Match
          </p>
        </article>
      </section>

      <section className="admin-panel-card admin-activity-card">
        <div className="admin-panel-header">
          <div>
            <p className="admin-eyebrow">
              QUICK OVERVIEW
            </p>

            <h2>Club Activity</h2>
          </div>
        </div>

        <div className="admin-activity-list">
          <div>
            <span className="activity-dot"></span>

            <p>
              <strong>4 fixtures</strong> are currently
              scheduled.
            </p>
          </div>

          <div>
            <span className="activity-dot"></span>

            <p>
              <strong>13 players</strong> are currently
              registered.
            </p>
          </div>

          <div>
            <span className="activity-dot"></span>

            <p>
              <strong>6 news stories</strong> are
              published.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;