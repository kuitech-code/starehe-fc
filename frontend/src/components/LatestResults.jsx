import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchApiList, formatDate, resultLetter } from "../api";
import ClubBadge from "./ClubBadge";

function LatestResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchApiList("/api/results", "results")
      .then((data) => {
        if (!cancelled) setResults(data.slice(0, 3));
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

  return (
    <section className="results-section">
      <div className="section-container">
        <div className="results-header">
          <div className="section-heading">
            <p className="section-eyebrow">LATEST RESULTS</p>
            <h2>How we have been doing.</h2>
          </div>
          <Link to="/results" className="results-link">
            View All Results →
          </Link>
        </div>

        {loading ? (
          <p role="status">Loading results...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : results.length === 0 ? (
          <p>No results have been added yet.</p>
        ) : (
          <div className="results-list">
            {results.map((match) => {
              const result = resultLetter(match);

              return (
                <article className="result-card" key={match.id}>
                  <div className="result-date">
                    <strong>{formatDate(match.match_date)}</strong>
                    <span>{match.competition || "Match"} </span>
                  </div>

                  <div className="result-opponent">
                    <span className="result-club"><ClubBadge name="Starehe FC" size="small" />Starehe FC</span>
                    <strong>vs</strong>
                    <span className="result-club"><ClubBadge src={match.opponent_logo_url} name={match.opponent} size="small" />{match.opponent}</span>
                  </div>

                  <div className="result-score">
                    <strong>
                      {match.starehe_score} - {match.opponent_score}
                    </strong>
                    <span
                      className={`result-badge result-${result.toLowerCase()}`}
                    >
                      {result}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default LatestResults;
