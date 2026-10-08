function News() {
  const articles = [
    {
      id: 1,
      title: "Starehe FC secure another important league victory",
      excerpt:
        "A strong performance from the team sees Starehe FC collect another three points in front of the home supporters.",
      date: "12 October 2026",
      category: "Match Report",
      image: null,
    },
    {
      id: 2,
      title: "The squad prepares for another big matchday",
      excerpt:
        "The team continues preparations as another important fixture approaches.",
      date: "9 October 2026",
      category: "Club News",
      image: null,
    },
    {
      id: 3,
      title: "Meet the players representing Starehe FC this season",
      excerpt:
        "Get to know the players wearing the Starehe FC colours this season.",
      date: "4 October 2026",
      category: "Team",
      image: null,
    },
    {
      id: 4,
      title: "Inside the club: Building a stronger Starehe FC",
      excerpt:
        "A look at the people, values and ambition driving the club forward.",
      date: "30 September 2026",
      category: "Club News",
      image: null,
    },
    {
      id: 5,
      title: "Five things to watch ahead of our next fixture",
      excerpt:
        "The key talking points as Starehe FC prepares for another competitive league encounter.",
      date: "27 September 2026",
      category: "Preview",
      image: null,
    },
    {
      id: 6,
      title: "Football, community and the Starehe FC family",
      excerpt:
        "Our club is about more than what happens on the pitch.",
      date: "22 September 2026",
      category: "Community",
      image: null,
    },
  ];

  const featuredArticle = articles[0];
  const remainingArticles = articles.slice(1);

  return (
    <main className="news-page">

      <section className="page-hero">
        <div className="section-container">
          <p className="section-eyebrow">STAREHE FC</p>

          <h1>News</h1>

          <p>
            Stories, updates and everything happening around the club.
          </p>
        </div>
      </section>

      <section className="news-page-content">
        <div className="section-container">

          <div className="news-page-heading">
            <p className="section-eyebrow">
              FROM THE CLUB
            </p>

            <h2>Latest stories.</h2>
          </div>

          {/* FEATURED STORY */}

          <article className="featured-news-card">

            <div className="featured-news-image">

              {featuredArticle.image ? (
                <img
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                />
              ) : (
                <div className="news-photo-placeholder">
                  <span>
                    {featuredArticle.category}
                  </span>
                </div>
              )}

            </div>

            <div className="featured-news-content">

              <span className="news-category">
                {featuredArticle.category}
              </span>

              <p className="news-date">
                {featuredArticle.date}
              </p>

              <h2>
                {featuredArticle.title}
              </h2>

              <p className="news-excerpt">
                {featuredArticle.excerpt}
              </p>

              <a
                href="#"
                className="news-button"
              >
                Read Story →
              </a>

            </div>

          </article>


          {/* NEWS GRID */}

          <div className="news-page-grid">

            {remainingArticles.map((article) => (
              <article
                className="full-news-card"
                key={article.id}
              >

                <div className="full-news-image">

                  {article.image ? (
                    <img
                      src={article.image}
                      alt={article.title}
                    />
                  ) : (
                    <div className="news-photo-placeholder">
                      <span>
                        {article.category}
                      </span>
                    </div>
                  )}

                </div>

                <div className="full-news-content">

                  <div className="full-news-meta">
                    <span>{article.category}</span>
                    <p>{article.date}</p>
                  </div>

                  <h3>
                    {article.title}
                  </h3>

                  <p>
                    {article.excerpt}
                  </p>

                  <a
                    href="#"
                    className="news-read-link"
                  >
                    Read Story →
                  </a>

                </div>

              </article>
            ))}

          </div>

        </div>
      </section>

    </main>
  );
}

export default News;