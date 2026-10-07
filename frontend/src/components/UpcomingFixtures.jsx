function UpcomingFixtures() {
  const fixtures = [
    {
      date: "18 October 2026",
      time: "3:00 PM",
      opponent: "Murai FC",
      venue: "Starehe Grounds",
      home: true,
    },
    {
      date: "25 October 2026",
      time: "2:00 PM",
      opponent: "Ndaragwa United",
      venue: "Ndaragwa Stadium",
      home: false,
    },
    {
      date: "1 November 2026",
      time: "3:30 PM",
      opponent: "Nyeri City",
      venue: "Starehe Grounds",
      home: true,
    },
  ];

  return (
    <section className="fixtures-section">
      <div className="section-container">
        <div className="results-header">
          <div className="section-heading">
            <p className="section-eyebrow">UPCOMING FIXTURES</p>
            <h2>What's next?</h2>
          </div>

          <a href="/fixtures" className="results-link">
            View All Fixtures →
          </a>
        </div>

        <div className="fixtures-grid">
          {fixtures.map((fixture) => (
            <article
              className="fixture-card"
              key={`${fixture.date}-${fixture.opponent}`}
            >
              <div className="fixture-date">
                <strong>{fixture.date}</strong>
                <span>{fixture.time}</span>
              </div>

              <div className="fixture-match">
                <div className="fixture-team">
                  <div className="small-team-placeholder">S</div>
                  <strong>Starehe FC</strong>
                </div>

                <span className="fixture-vs">VS</span>

                <div className="fixture-team">
                  <div className="small-team-placeholder opponent">
                    {fixture.opponent.charAt(0)}
                  </div>
                  <strong>{fixture.opponent}</strong>
                </div>
              </div>

              <div className="fixture-details">
                <span>{fixture.home ? "HOME" : "AWAY"}</span>
                <p>{fixture.venue}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default UpcomingFixtures;