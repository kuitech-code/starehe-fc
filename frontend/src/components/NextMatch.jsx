function NextMatch() {
  return (
    <section className="next-match">
      <div className="section-container">
        <div className="section-heading">
          <p className="section-eyebrow">NEXT MATCH</p>
          <h2>Matchday is coming.</h2>
        </div>

        <div className="match-card">
          <div className="match-team">
            <div className="team-placeholder">S</div>
            <h3>Starehe FC</h3>
            <p>Home</p>
          </div>

          <div className="match-info">
            <span className="match-label">LEAGUE MATCH</span>
            <strong>VS</strong>
            <p>Sunday, 18 October</p>
            <p>3:00 PM</p>
          </div>

          <div className="match-team">
            <div className="team-placeholder opponent">O</div>
            <h3>Opponent FC</h3>
            <p>Away</p>
          </div>
        </div>

        <div className="match-action">
          <a href="/fixtures" className="dark-button">
            View All Fixtures
          </a>
        </div>
      </div>
    </section>
  );
}

export default NextMatch;