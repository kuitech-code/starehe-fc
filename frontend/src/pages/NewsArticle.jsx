import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

function imageSource(value) {
  if (!value) return "";
  if (/^(data:|https?:\/\/)/i.test(value)) return value;
  return `${API_ORIGIN}${value.startsWith("/") ? value : `/${value}`}`;
}

function formatDate(value) {
  if (!value) return "";
  const datePart = String(value).slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? new Date(`${datePart}T12:00:00`) : new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function NewsArticle() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_ORIGIN}/api/news/published/${id}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not open this story.");
        return data;
      })
      .then((data) => { if (!cancelled) setArticle(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const photos = article?.images?.length
    ? article.images
    : article?.image_url ? [{ image_url: article.image_url }] : [];

  return (
    <main className="news-article-page">
      <section className="news-article-content faded-background">
        <div className="section-container">
          <Link to="/news" className="news-back-link">← All News</Link>
          {loading ? <p role="status">Opening story...</p> : error ? (
            <div className="news-article-error" role="alert"><h1>Story unavailable</h1><p>{error}</p></div>
          ) : article ? (
            <article className="news-article">
              <header className="news-article-header">
                <span className="news-category">{article.category}</span>
                <p className="news-date">{formatDate(article.published_at || article.updated_at)}</p>
                <h1>{article.title}</h1>
                <p className="news-article-excerpt">{article.excerpt}</p>
              </header>
              {photos.length > 0 && (
                <div className={`news-article-gallery ${photos.length === 1 ? "single" : ""}`}>
                  {photos.map((photo, index) => <img key={photo.id || photo.image_url} src={imageSource(photo.image_url)} alt={`${article.title} — photo ${index + 1}`} />)}
                </div>
              )}
              <div className="news-article-body">{(article.content || article.excerpt).split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
            </article>
          ) : null}
        </div>
      </section>
    </main>
  );
}
