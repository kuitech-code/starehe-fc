function Results() {
  const results = [
    {
      id: 1,
      date: "12 October 2026",
      day: "Sunday",
      opponent: "Murai FC",
      competition: "League Match",
      homeScore: 3,
      awayScore: 1,
      home: true,
      venue: "Starehe Grounds",
    },
    {
      id: 2,
      date: "5 October 2026",
      day: "Sunday",
      opponent: "Ndaragwa United",
      competition: "League Match",
      homeScore: 1,
      awayScore: 1,
      home: true,
      venue: "Starehe Grounds",
    },
    {
      id: 3,
      date: "28 September 2026",
      day: "Sunday",
      opponent: "Nyeri City",
      competition: "Cup Match",
      homeScore: 0,
      awayScore: 2,
      home: false,
      venue: "Nyeri Stadium",
    },
    {
      id: 4,
      date: "21 September 2026",
      day: "Sunday",
      opponent: "Karatina FC",
      competition: "League Match",
      homeScore: 2,
      awayScore: 0,
      home: true,
      venue: "Starehe Grounds",
    },
  ];

  const getResult = (match) => {
    if (match.homeScore === match.awayScore) {
      return "D";
    }

    if (match.home && match.homeScore > match.awayScore) {
      return "W";
    }

    if (!match.home && match.awayScore > match.homeScore) {
      return "W";
    }

    return "L";
  };

  return (
    <main className="results-page">

      <section className="page-hero">
        <div className="section-container">
          <p className="section-eyebrow">STAREHE FC</p>

          <h1>Results</h1>

          <p>
            Every match. Every result. Every moment.
          </p>
        </div>
      </section>

      <section className="results-page-content">
        <div className="section-container">

          <div className="results-page-heading">
            <p className="section-eyebrow">
              MATCH RESULTS
            </p>

            <h2>How we've been doing.</h2>
          </div>

          <div className="results-page-list">

            {results.map((match) => {
              const result = getResult(match);

              return (
                <article
                  className="result-full-card"
                  key={match.id}
                >

                  <div className="result-full-date">
                    <span>{match.day}</span>

                    <strong>{match.date}</strong>

                    <small>{match.competition}</small>
                  </div>


                  <div className="result-full-match">

                    <div className="result-full-team">
                      <div className="full-team-placeholder">
                        S
                      </div>

                      <strong>Starehe FC</strong>
                    </div>


                    <div className="result-full-score">

                      <span className={`full-result-badge result-${result.toLowerCase()}`}>
                        {result}
                      </span>

                      <strong>
                        {match.homeScore}
                        {" - "}
                        {match.awayScore}
                      </strong>

                    </div>


                    <div className="result-full-team">
                      <div className="full-team-placeholder opponent">
                        {match.opponent.charAt(0)}
                      </div>

                      <strong>{match.opponent}</strong>
                    </div>

                  </div>


                  <div className="result-full-venue">
                    <span>VENUE</span>

                    <strong>{match.venue}</strong>
                  </div>

                </article>
              );
            })}

          </div>

        </div>
      </section>

    </main>
  );
}

export default Results;