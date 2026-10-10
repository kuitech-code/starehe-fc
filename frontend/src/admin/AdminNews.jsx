
import { useState } from "react";

const initialArticles = [
  {
    id: 1,
    title: "Starehe FC Prepares for the New Season",
    category: "Club News",
    excerpt:
      "The team continues preparations as players and technical staff build momentum for the upcoming season.",
    status: "Published",
    date: "2026-10-05",
    imageUrl: "",
  },
  {
    id: 2,
    title: "A Message to Our Supporters",
    category: "Community",
    excerpt:
      "Our supporters remain the heartbeat of this club. We look forward to another season of unity and commitment.",
    status: "Published",
    date: "2026-10-03",
    imageUrl: "",
  },
  {
    id: 3,
    title: "Meet the Squad: New Season Edition",
    category: "Team News",
    excerpt:
      "Get to know the players representing Starehe FC as the team prepares for its next challenge.",
    status: "Draft",
    date: "2026-10-01",
    imageUrl: "",
  },
];

const emptyForm = {
  title: "",
  category: "Club News",
  excerpt: "",
  status: "Draft",
  imageUrl: "",
};

function AdminNews() {
  const [articles, setArticles] = useState(initialArticles);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [error, setError] = useState("");

  const categories = [
    "Club News",
    "Match Reports",
    "Team News",
    "Community",
    "Announcements",
  ];

  const publishedCount = articles.filter(
    (article) => article.status === "Published"
  ).length;

  const draftCount = articles.filter(
    (article) => article.status === "Draft"
  ).length;

  const filteredArticles = articles
    .filter((article) => {
      const term = search.toLowerCase().trim();

      return (
        article.title.toLowerCase().includes(term) ||
        article.excerpt.toLowerCase().includes(term) ||
        article.category.toLowerCase().includes(term)
      );
    })
    .filter(
      (article) =>
        statusFilter === "All" || article.status === statusFilter
    )
    .filter(
      (article) =>
        categoryFilter === "All" || article.category === categoryFilter
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    const title = form.title.trim();
    const excerpt = form.excerpt.trim();

    if (!title || !excerpt) {
      setError("Please enter both a headline and an article summary.");
      return;
    }

    const articleData = {
      ...form,
      title,
      excerpt,
      date: new Date().toISOString().slice(0, 10),
    };

    if (editingId !== null) {
      setArticles((current) =>
        current.map((article) =>
          article.id === editingId
            ? { ...article, ...articleData }
            : article
        )
      );
    } else {
      setArticles((current) => [
        {
          id: Date.now(),
          ...articleData,
        },
        ...current,
      ]);
    }

    resetForm();
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Please choose an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((current) => ({
        ...current,
        imageUrl: reader.result,
      }));
      setError("");
    };

    reader.onerror = () => {
      setError("We couldn't read that image. Please try another.");
    };

    reader.readAsDataURL(file);
  }

  function removeImage() {
    setForm((current) => ({
      ...current,
      imageUrl: "",
    }));

    const input = document.getElementById("news-image");

    if (input) input.value = "";
  }

  function handleEdit(article) {
    setForm({
      title: article.title,
      category: article.category,
      excerpt: article.excerpt,
      status: article.status,
      imageUrl: article.imageUrl || "",
    });

    setEditingId(article.id);
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this article?"
    );

    if (!confirmed) return;

    setArticles((current) =>
      current.filter((article) => article.id !== id)
    );

    if (editingId === id) {
      resetForm();
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">CONTENT MANAGEMENT</span>
          <h1>News & Articles</h1>
          <p>
            Share club updates, match reports, and stories with our
            supporters.
          </p>
        </div>
      </div>

      <div className="admin-player-stats admin-news-stats">
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Articles</span>
          <strong>{articles.length}</strong>
          <span className="admin-stat-note">All articles</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-label">Published</span>
          <strong>{publishedCount}</strong>
          <span className="admin-stat-note">Ready for readers</span>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-label">Drafts</span>
          <strong>{draftCount}</strong>
          <span className="admin-stat-note">Still in progress</span>
        </div>
      </div>

      <section className="admin-form-card">
        <div className="admin-form-header">
          <div>
            <h2>{editingId !== null ? "Edit Article" : "Create Article"}</h2>
            <p>
              {editingId !== null
                ? "Update your article details below."
                : "Write something worth sharing with the Starehe FC family."}
            </p>
          </div>

          {editingId !== null && (
            <button
              type="button"
              className="admin-secondary-button"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="admin-form-group admin-news-title-field">
              <label htmlFor="news-title">Headline *</label>
              <input
                id="news-title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter an article headline"
                maxLength={120}
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="news-category">Category</label>
              <select
                id="news-category"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label htmlFor="news-status">Publication Status</label>
              <select
                id="news-status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>

            <div className="admin-form-group admin-news-excerpt-field">
              <label htmlFor="news-excerpt">Article Summary *</label>
              <textarea
                id="news-excerpt"
                name="excerpt"
                value={form.excerpt}
                onChange={handleChange}
                placeholder="Give readers a short introduction to this story..."
                rows={4}
                maxLength={500}
                required
              />
              <small>{form.excerpt.length}/500 characters</small>
            </div>

            <div className="admin-form-group admin-news-image-field">
              <label htmlFor="news-image">Featured Image</label>

              <input
                id="news-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />

              <small>Choose a JPG, PNG, or WebP image up to 5 MB.</small>

              {form.imageUrl && (
                <div className="admin-news-image-preview">
                  <img src={form.imageUrl} alt="Featured image preview" />

                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={removeImage}
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && <p className="admin-form-error">{error}</p>}

          <div className="admin-form-actions">
            <button type="button" className="admin-secondary-button" onClick={resetForm}>
              Clear Form
            </button>

            <button type="submit" className="admin-primary-button">
              {editingId !== null ? "Save Changes" : "Create Article"}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-news-library">
        <div className="admin-list-header">
          <div>
            <h2>Article Library</h2>
            <span className="admin-count">
              {filteredArticles.length}{" "}
              {filteredArticles.length === 1 ? "article" : "articles"}
            </span>
          </div>
        </div>

        <div className="admin-player-filters admin-news-filters">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search headlines, summaries..."
            aria-label="Search articles"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by publication status"
          >
            <option value="All">All statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Drafts</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter by category"
          >
            <option value="All">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No articles found</h3>
            <p>Try another search or adjust your filters.</p>
          </div>
        ) : (
          <div className="admin-news-list">
            {filteredArticles.map((article) => (
              <article className="admin-news-card" key={article.id}>
                {article.imageUrl && (
                  <img
                    className="admin-news-card-image"
                    src={article.imageUrl}
                    alt={article.title}
                  />
                )}
                
                <div className="admin-news-card-content">
                  <div className="admin-news-card-meta">
                    <span className="admin-news-category">
                      {article.category}
                    </span>

                    <span
                      className={`admin-news-status ${
                        article.status === "Published"
                          ? "news-status-published"
                          : "news-status-draft"
                      }`}
                    >
                      {article.status}
                    </span>
                  </div>

                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>

                  <span className="admin-news-date">
                    Updated {article.date}
                  </span>
                </div>

                <div className="admin-news-actions">
                  <button
                    type="button"
                    className="admin-edit-button"
                    onClick={() => handleEdit(article)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() => handleDelete(article.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminNews;
