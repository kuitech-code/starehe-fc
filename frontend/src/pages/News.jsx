import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_URL = `${API_ORIGIN}/api/news/published`;

function imageSource(imageUrl) {
  if (!imageUrl) return "";
  if (/^(data:|https?:\/\/)/i.test(imageUrl)) return imageUrl;
  return `${API_ORIGIN}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(API_URL)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not load news.");
        if (!Array.isArray(data)) throw new Error("The news service returned an unexpected response.");
        return data;
      })
      .then((data) => { if (!cancelled) setArticles(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const featuredArticle = articles[0];
  const remainingArticles = articles.slice(1);

  return (
    <main className="news-page">
      <section className="page-hero">
        <div className="section-container">
          <p className="section-eyebrow">STAREHE FC</p>
          <h1>News</h1>
          <p>Stories, updates and everything happening around the club.</p>
        </div>
      </section>

      <section className="news-page-content faded-background">
        <div className="section-container">
          <div className="news-page-heading">
            <p className="section-eyebrow">FROM THE CLUB</p>
            <h2>Latest stories.</h2>
          </div>

          {loading ? (
            <p className="news-excerpt" role="status">Loading news...</p>
          ) : error ? (
            <p className="news-excerpt" role="alert">{error}</p>
          ) : !featuredArticle ? (
            <p className="news-excerpt">No published stories yet. Please check back soon.</p>
          ) : (
            <>
              <article className="featured-news-card">
                <Link to={`/news/${featuredArticle.id}`} className="featured-news-image" aria-label={`Read ${featuredArticle.title}`}>
                  {featuredArticle.image_url ? (
                    <img src={imageSource(featuredArticle.image_url)} alt={featuredArticle.title} />
                  ) : (
                    <div className="news-photo-placeholder"><span>{featuredArticle.category}</span></div>
                  )}
                </Link>
                <div className="featured-news-content">
                  <span className="news-category">{featuredArticle.category}</span>
                  <p className="news-date">{formatDate(featuredArticle.published_at || featuredArticle.updated_at)}</p>
                  <h2>{featuredArticle.title}</h2>
                  <p className="news-excerpt">{featuredArticle.excerpt}</p>
                  <Link className="news-button" to={`/news/${featuredArticle.id}`}>Read Story</Link>
                </div>
              </article>

              <div className="news-page-grid">
                {remainingArticles.map((article) => (
                  <Link className="full-news-card" key={article.id} to={`/news/${article.id}`}>
                    <div className="full-news-image">
                      {article.image_url ? (
                        <img src={imageSource(article.image_url)} alt={article.title} />
                      ) : (
                        <div className="news-photo-placeholder"><span>{article.category}</span></div>
                      )}
                    </div>
                    <div className="full-news-content">
                      <div className="full-news-meta">
                        <span>{article.category}</span>
                        <p>{formatDate(article.published_at || article.updated_at)}</p>
                      </div>
                      <h3>{article.title}</h3>
                      <p>{article.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default News;
