function Table() {
  const results = [
    {
      homeTeam: "Starehe FC",
      awayTeam: "Murai FC",
      homeScore: 3,
      awayScore: 1,
    },
    {
      homeTeam: "Starehe FC",
      awayTeam: "Ndaragwa United",
      homeScore: 1,
      awayScore: 1,
    },
    {
      homeTeam: "Nyeri City",
      awayTeam: "Starehe FC",
      homeScore: 2,
      awayScore: 0,
    },
    {
      homeTeam: "Karatina FC",
      awayTeam: "Murai FC",
      homeScore: 2,
      awayScore: 2,
    },
    {
      homeTeam: "Ndaragwa United",
      awayTeam: "Nyeri City",
      homeScore: 1,
      awayScore: 0,
    },
    {
      homeTeam: "Karatina FC",
      awayTeam: "Ndaragwa United",
      homeScore: 1,
      awayScore: 3,
    },
  ];

  const teams = [
    "Starehe FC",
    "Murai FC",
    "Ndaragwa United",
    "Nyeri City",
    "Karatina FC",
  ];

  const table = teams.map((team) => {
    const stats = {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    };

    results.forEach((match) => {
      const isHome = match.homeTeam === team;
      const isAway = match.awayTeam === team;

      if (!isHome && !isAway) {
        return;
      }

      stats.played += 1;

      if (isHome) {
        stats.goalsFor += match.homeScore;
        stats.goalsAgainst += match.awayScore;

        if (match.homeScore > match.awayScore) {
          stats.won += 1;
          stats.points += 3;
        } else if (match.homeScore === match.awayScore) {
          stats.drawn += 1;
          stats.points += 1;
        } else {
          stats.lost += 1;
        }
      }

      if (isAway) {
        stats.goalsFor += match.awayScore;
        stats.goalsAgainst += match.homeScore;

        if (match.awayScore > match.homeScore) {
          stats.won += 1;
          stats.points += 3;
        } else if (match.awayScore === match.homeScore) {
          stats.drawn += 1;
          stats.points += 1;
        } else {
          stats.lost += 1;
        }
      }
    });

    stats.goalDifference =
      stats.goalsFor - stats.goalsAgainst;

    return stats;
  });

  table.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }

    return b.goalsFor - a.goalsFor;
  });

  return (
    <main className="table-page">

      <section className="page-hero">
        <div className="section-container">
          <p className="section-eyebrow">STAREHE FC</p>

          <h1>League Table</h1>

          <p>
            Follow the race for the top of the table.
          </p>
        </div>
      </section>

      <section className="table-page-content">
        <div className="section-container">

          <div className="table-page-heading">
            <p className="section-eyebrow">
              CURRENT STANDINGS
            </p>

            <h2>League Table</h2>
          </div>

          <div className="table-wrapper">

            <table className="league-table">

              <thead>
                <tr>
                  <th>POS</th>
                  <th>TEAM</th>
                  <th>P</th>
                  <th>W</th>
                  <th>D</th>
                  <th>L</th>
                  <th>GF</th>
                  <th>GA</th>
                  <th>GD</th>
                  <th>PTS</th>
                </tr>
              </thead>

              <tbody>
                {table.map((team, index) => (
                  <tr
                    key={team.team}
                    className={
                      team.team === "Starehe FC"
                        ? "current-team"
                        : ""
                    }
                  >
                    <td className="position">
                      {index + 1}
                    </td>

                    <td className="table-team">
                      {team.team}
                    </td>

                    <td>{team.played}</td>

                    <td>{team.won}</td>

                    <td>{team.drawn}</td>

                    <td>{team.lost}</td>

                    <td>{team.goalsFor}</td>

                    <td>{team.goalsAgainst}</td>

                    <td>
                      {team.goalDifference > 0
                        ? `+${team.goalDifference}`
                        : team.goalDifference}
                    </td>

                    <td className="points">
                      {team.points}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>

          </div>

          <div className="table-key">
            <span><strong>P</strong> Played</span>
            <span><strong>W</strong> Won</span>
            <span><strong>D</strong> Drawn</span>
            <span><strong>L</strong> Lost</span>
            <span><strong>GF</strong> Goals For</span>
            <span><strong>GA</strong> Goals Against</span>
            <span><strong>GD</strong> Goal Difference</span>
            <span><strong>PTS</strong> Points</span>
          </div>

        </div>
      </section>

    </main>
  );
}

export default Table;