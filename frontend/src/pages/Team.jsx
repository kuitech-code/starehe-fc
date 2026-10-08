function Team() {
  const players = [
    {
      id: 1,
      name: "Brian Mwangi",
      number: 1,
      position: "Goalkeeper",
      image: null,
    },
    {
      id: 2,
      name: "Peter Kamau",
      number: 22,
      position: "Goalkeeper",
      image: null,
    },
    {
      id: 3,
      name: "Kevin Kariuki",
      number: 5,
      position: "Defender",
      image: null,
    },
    {
      id: 4,
      name: "John Maina",
      number: 3,
      position: "Defender",
      image: null,
    },
    {
      id: 5,
      name: "Dennis Njoroge",
      number: 4,
      position: "Defender",
      image: null,
    },
    {
      id: 6,
      name: "Eric Wambui",
      number: 2,
      position: "Defender",
      image: null,
    },
    {
      id: 7,
      name: "David Maina",
      number: 8,
      position: "Midfielder",
      image: null,
    },
    {
      id: 8,
      name: "Samuel Kariuki",
      number: 6,
      position: "Midfielder",
      image: null,
    },
    {
      id: 9,
      name: "James Mwangi",
      number: 10,
      position: "Midfielder",
      image: null,
    },
    {
      id: 10,
      name: "Martin Ndirangu",
      number: 7,
      position: "Midfielder",
      image: null,
    },
    {
      id: 11,
      name: "Samuel Njoroge",
      number: 9,
      position: "Forward",
      image: null,
    },
    {
      id: 12,
      name: "Alex Kariuki",
      number: 11,
      position: "Forward",
      image: null,
    },
    {
      id: 13,
      name: "Victor Maina",
      number: 17,
      position: "Forward",
      image: null,
    },
  ];

  const positions = [
    "Goalkeeper",
    "Defender",
    "Midfielder",
    "Forward",
  ];

  return (
    <main className="team-page">

      <section className="page-hero">
        <div className="section-container">
          <p className="section-eyebrow">STAREHE FC</p>

          <h1>The Team</h1>

          <p>
            Meet the players representing Starehe FC.
          </p>
        </div>
      </section>

      <section className="team-page-content">
        <div className="section-container">

          {positions.map((position) => {

            const positionPlayers = players.filter(
              (player) => player.position === position
            );

            return (
              <section
                className="squad-group"
                key={position}
              >

                <div className="squad-heading">
                  <p className="section-eyebrow">
                    THE SQUAD
                  </p>

                  <h2>{position}s</h2>
                </div>

                <div className="squad-grid">

                  {positionPlayers.map((player) => (
                    <article
                      className="squad-player-card"
                      key={player.id}
                    >

                      <div className="squad-player-image">

                        {player.image ? (
                          <img
                            src={player.image}
                            alt={player.name}
                          />
                        ) : (
                          <div className="player-photo-placeholder">
                            <span>
                              {player.number}
                            </span>
                          </div>
                        )}

                        <div className="player-number">
                          {player.number}
                        </div>

                      </div>

                      <div className="squad-player-info">

                        <span>
                          {player.position}
                        </span>

                        <h3>
                          {player.name}
                        </h3>

                        <p>
                          #{player.number}
                        </p>

                      </div>

                    </article>
                  ))}

                </div>

              </section>
            );
          })}

        </div>
      </section>

    </main>
  );
}

export default Team;
