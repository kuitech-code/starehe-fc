function TeamPreview() {
  const players = [
    {
      number: 1,
      name: "Brian Mwangi",
      position: "Goalkeeper",
    },
    {
      number: 5,
      name: "Kevin Kariuki",
      position: "Defender",
    },
    {
      number: 8,
      name: "David Maina",
      position: "Midfielder",
    },
    {
      number: 10,
      name: "Samuel Njoroge",
      position: "Forward",
    },
  ];

  return (
    <section className="team-section">
      <div className="section-container">
        <div className="results-header">
          <div className="section-heading">
            <p className="section-eyebrow">THE SQUAD</p>
            <h2>Meet the team.</h2>
          </div>

          <a href="/team" className="results-link">
            View Full Squad →
          </a>
        </div>

        <div className="players-grid">
          {players.map((player) => (
            <article className="player-card" key={player.number}>
              <div className="player-image">
                <span>{player.number}</span>
              </div>

              <div className="player-info">
                <span>{player.position}</span>
                <h3>{player.name}</h3>
                <p>#{player.number}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TeamPreview;