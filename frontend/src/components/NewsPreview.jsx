function NewsPreview() {
  const articles = [
    {
      title: "Starehe FC secure another important league victory",
      date: "12 October 2026",
      category: "Match Report",
    },
    {
      title: "The squad prepares for another big matchday",
      date: "9 October 2026",
      category: "Club News",
    },
    {
      title: "Meet the players representing Starehe FC this season",
      date: "4 October 2026",
      category: "Team",
    },
  ];

  return (
    <section className="news-section">
      <div className="section-container">
        <div className="results-header">
          <div className="section-heading">
            <p className="section-eyebrow">LATEST NEWS</p>
            <h2>From the club.</h2>
          </div>

          <a href="/news" className="results-link">
            View All News →
          </a>
        </div>

        <div className="news-grid">
          {articles.map((article) => (
            <article className="news-card" key={article.title}>
              <div className="news-image">
                <span>{article.category}</span>
              </div>

              <div className="news-content">
                <p>{article.date}</p>

                <h3>{article.title}</h3>

                <a href="/news" className="news-read-more">
                  Read Story →
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default NewsPreview;