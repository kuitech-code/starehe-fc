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

function NewsPreview() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(API_URL)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("News is unavailable.")))
      .then((data) => { if (!cancelled && Array.isArray(data)) setArticles(data.slice(0, 3)); })
      .catch(() => { if (!cancelled) setArticles([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="news-section">
      <div className="section-container">
        <div className="results-header">
          <div className="section-heading">
            <p className="section-eyebrow">LATEST NEWS</p>
            <h2>From the club.</h2>
          </div>
          <Link to="/news" className="results-link">View All News →</Link>
        </div>

        {loading ? (
          <p role="status">Loading news...</p>
        ) : articles.length === 0 ? (
          <p>No published stories yet. Please check back soon.</p>
        ) : (
          <div className="news-grid">
            {articles.map((article) => (
              <article className="news-card" key={article.id}>
                <div className="news-image">
                  {article.image_url ? (
                    <img src={imageSource(article.image_url)} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span>{article.category}</span>
                  )}
                </div>
                <div className="news-content">
                  <p>{formatDate(article.published_at || article.updated_at)}</p>
                  <h3>{article.title}</h3>
                  <Link to="/news" className="news-read-more">Read Story →</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default NewsPreview;
