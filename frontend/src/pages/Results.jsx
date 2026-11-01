import { useEffect, useState } from "react";
import { fetchApiList, formatDate, resultLetter } from "../api";
import ClubBadge from "../components/ClubBadge";

const RESULTS_PER_PAGE = 10;

function Results() {
  const [results, setResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const totalPages = Math.max(1, Math.ceil(results.length / RESULTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedResults = results.slice(
    (safePage - 1) * RESULTS_PER_PAGE,
    safePage * RESULTS_PER_PAGE,
  );

  useEffect(() => {
    let cancelled = false;

    fetchApiList("/api/results", "results")
      .then((data) => {
        if (!cancelled) setResults(data);
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
    <main className="results-page">
      <section className="page-hero">
        <div className="section-container">
          <p className="section-eyebrow">STAREHE FC</p>
          <h1>Results</h1>
          <p>Every match. Every result. Every moment.</p>
        </div>
      </section>

      <section className="results-page-content faded-background">
        <div className="section-container">
          <div className="results-page-heading">
            <p className="section-eyebrow">MATCH RESULTS</p>
            <h2>How we've been doing.</h2>
          </div>

          {loading ? (
            <p role="status">Loading results...</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : results.length === 0 ? (
            <p>No results have been added yet.</p>
          ) : (
            <div className="results-page-list">
              {paginatedResults.map((match) => {
                const result = resultLetter(match);

                return (
                  <article className="result-full-card" key={match.id}>
                    <div className="result-full-date">
                      <span>
                        {formatDate(match.match_date, { weekday: "long" })}
                      </span>
                      <strong>{formatDate(match.match_date)}</strong>
                      <small>{match.competition || "Match"}</small>
                    </div>

                    <div className="result-full-match">
                      <div className="result-full-team">
                        <ClubBadge name="Starehe FC" />
                        <strong>Starehe FC</strong>
                      </div>

                      <div className="result-full-score">
                        <span
                          className={`full-result-badge result-${result.toLowerCase()}`}
                        >
                          {result}
                        </span>
                        <strong>
                          {match.starehe_score} - {match.opponent_score}
                        </strong>
                      </div>

                      <div className="result-full-team">
                        <ClubBadge src={match.opponent_logo_url} name={match.opponent} />
                        <strong>{match.opponent}</strong>
                      </div>
                    </div>

                    <div className="result-full-venue">
                      <span>VENUE</span>
                      <strong>{match.venue || "Venue not recorded"}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {!loading && !error && results.length > RESULTS_PER_PAGE && (
            <nav className="results-pagination" aria-label="Results pages">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setCurrentPage(safePage - 1)}
                disabled={safePage === 1}
              >
                Previous
              </button>
              <span>Page {safePage} of {totalPages}</span>
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setCurrentPage(safePage + 1)}
                disabled={safePage === totalPages}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </section>
    </main>
  );
}

export default Results;
