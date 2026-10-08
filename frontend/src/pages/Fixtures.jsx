function Fixtures() {
  const fixtures = [
    {
      id: 1,
      date: "18 October 2026",
      day: "Sunday",
      time: "3:00 PM",
      opponent: "Murai FC",
      venue: "Starehe Grounds",
      competition: "League Match",
      home: true,
    },
    {
      id: 2,
      date: "25 October 2026",
      day: "Sunday",
      time: "2:00 PM",
      opponent: "Ndaragwa United",
      venue: "Ndaragwa Stadium",
      competition: "League Match",
      home: false,
    },
    {
      id: 3,
      date: "1 November 2026",
      day: "Sunday",
      time: "3:30 PM",
      opponent: "Nyeri City",
      venue: "Starehe Grounds",
      competition: "Cup Match",
      home: true,
    },
    {
      id: 4,
      date: "8 November 2026",
      day: "Sunday",
      time: "3:00 PM",
      opponent: "Karatina FC",
      venue: "Karatina Stadium",
      competition: "League Match",
      home: false,
    },
  ];

  return (
    <main className="fixtures-page">
      <section className="page-hero">
        <div className="section-container">
          <p className="section-eyebrow">STAREHE FC</p>
          <h1>Fixtures</h1>
          <p>
            Follow Starehe FC through every matchday.
          </p>
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

          <div className="fixtures-page-list">
            {fixtures.map((fixture) => (
              <article
                className="fixture-full-card"
                key={fixture.id}
              >
                <div className="fixture-full-date">
                  <span>{fixture.day}</span>
                  <strong>{fixture.date}</strong>
                  <small>{fixture.time}</small>
                </div>

                <div className="fixture-full-match">

                  <div className="fixture-full-team">
                    <div className="full-team-placeholder">
                      S
                    </div>

                    <strong>Starehe FC</strong>

                    <span>
                      {fixture.home ? "HOME" : "AWAY"}
                    </span>
                  </div>

                  <div className="fixture-full-vs">
                    <small>{fixture.competition}</small>
                    <strong>VS</strong>
                  </div>

                  <div className="fixture-full-team">
                    <div className="full-team-placeholder opponent">
                      {fixture.opponent.charAt(0)}
                    </div>

                    <strong>{fixture.opponent}</strong>

                    <span>
                      {fixture.home ? "AWAY" : "HOME"}
                    </span>
                  </div>

                </div>

                <div className="fixture-full-venue">
                  <span>VENUE</span>
                  <strong>{fixture.venue}</strong>
                </div>
              </article>
            ))}
          </div>

        </div>
      </section>
    </main>
  );
}

export default Fixtures;