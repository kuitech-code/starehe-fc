function LatestResults() {
  const results = [
    {
      opponent: "Murai FC",
      date: "12 October 2026",
      competition: "League Match",
      homeScore: 3,
      awayScore: 1,
      result: "W",
    },
    {
      opponent: "Ndaragwa United",
      date: "5 October 2026",
      competition: "League Match",
      homeScore: 1,
      awayScore: 1,
      result: "D",
    },
    {
      opponent: "Nyeri City",
      date: "28 September 2026",
      competition: "Cup Match",
      homeScore: 0,
      awayScore: 2,
      result: "L",
    },
  ];

  return (
    <section className="results-section">
      <div className="section-container">
        <div className="results-header">
          <div className="section-heading">
            <p className="section-eyebrow">LATEST RESULTS</p>
            <h2>How we have been doing.</h2>
          </div>

          <a href="/results" className="results-link">
            View All Results →
          </a>
        </div>

        <div className="results-list">
          {results.map((match) => (
            <article className="result-card" key={`${match.opponent}-${match.date}`}>
              <div className="result-date">
                <strong>{match.date}</strong>
                <span>{match.competition}</span>
              </div>

              <div className="result-opponent">
                <span>Starehe FC</span>
                <strong>vs</strong>
                <span>{match.opponent}</span>
              </div>

              <div className="result-score">
                <strong>
                  {match.homeScore} - {match.awayScore}
                </strong>

                <span className={`result-badge result-${match.result.toLowerCase()}`}>
                  {match.result}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LatestResults;