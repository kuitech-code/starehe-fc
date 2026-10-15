import { useEffect, useState } from "react";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_URL = `${API_ORIGIN}/api/news`;

const emptyForm = {
  title: "",
  category: "Club News",
  excerpt: "",
  content: "",
  status: "Draft",
  images: [],
  existingImages: [],
  removeImageIds: [],
  removeLegacyCover: false,
};

const categories = ["Club News", "Match Reports", "Team News", "Community", "Announcements"];

function imageSource(imageUrl) {
  if (!imageUrl) return "";
  if (/^(data:|https?:\/\/)/i.test(imageUrl)) return imageUrl;
  return `${API_ORIGIN}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}

async function requestNews(path = "", options = {}) {
  let response;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(!isFormData && options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Could not reach the backend. Make sure it is running on port 5000.");
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = Array.isArray(data.details) ? ` ${data.details.join(". ")}.` : "";
    throw new Error(`${data.error || "The request failed."}${details}`);
  }
  return data;
}

function fromApi(article) {
  return {
    id: article.id,
    title: article.title,
    category: article.category,
    excerpt: article.excerpt,
    content: article.content || "",
    status: article.status,
    date: String(article.updated_at || article.published_at || article.created_at || "").slice(0, 10),
    imageUrl: article.image_url || "",
    images: Array.isArray(article.images) && article.images.length
      ? article.images
      : article.image_url ? [{ id: null, image_url: article.image_url }] : [],
  };
}

function AdminNews() {
  const [articles, setArticles] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let cancelled = false;
    requestNews()
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("The news API returned an unexpected response.");
        if (!cancelled) setArticles(data.map(fromApi));
      })
      .catch((err) => { if (!cancelled) setPageError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const publishedCount = articles.filter((article) => article.status === "Published").length;
  const draftCount = articles.filter((article) => article.status === "Draft").length;
  const term = search.toLowerCase().trim();
  const filteredArticles = articles
    .filter((article) => article.title.toLowerCase().includes(term) || article.excerpt.toLowerCase().includes(term) || article.category.toLowerCase().includes(term))
    .filter((article) => statusFilter === "All" || article.status === statusFilter)
    .filter((article) => categoryFilter === "All" || article.category === categoryFilter)
    .sort((a, b) => b.date.localeCompare(a.date));

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setPageError("");
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setError("");
    const input = document.getElementById("news-images");
    if (input) input.value = "";
  }

  function handleImageChange(event) {
    const files = Array.from(event.target.files || []);
    const keptExistingCount = form.existingImages.filter((image) => image.id === null
      ? !form.removeLegacyCover
      : !form.removeImageIds.includes(image.id)).length;
    if (keptExistingCount + form.images.length + files.length > 10) {
      setError("An article can have up to 10 photos.");
      event.target.value = "";
      return;
    }
    const invalid = files.find((file) => !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalid) {
      setError(invalid.size > 5 * 1024 * 1024 ? "Each photo must be 5 MB or smaller." : "Choose JPG, PNG, WebP, or GIF photos.");
      event.target.value = "";
      return;
    }
    setForm((current) => ({ ...current, images: [...current.images, ...files] }));
    setError("");
    event.target.value = "";
  }

  function removeExistingImage(image) {
    if (image.id === null) {
      setForm((current) => ({ ...current, removeLegacyCover: true }));
    } else {
      setForm((current) => ({ ...current, removeImageIds: [...current.removeImageIds, image.id] }));
    }
  }

  function removeSelectedImage(index) {
    setForm((current) => ({ ...current, images: current.images.filter((_, fileIndex) => fileIndex !== index) }));
  }

  function handleEdit(article) {
    setForm({
      title: article.title,
      category: article.category,
      excerpt: article.excerpt,
      content: article.content || "",
      status: article.status,
      images: [],
      existingImages: article.images || (article.imageUrl ? [{ id: null, image_url: article.imageUrl }] : []),
      removeImageIds: [],
      removeLegacyCover: false,
    });
    setEditingId(article.id);
    setError("");
    setPageError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const title = form.title.trim();
    const excerpt = form.excerpt.trim();
    if (!title || !excerpt) {
      setError("Please enter both a headline and an article summary.");
      return;
    }

    const payload = new FormData();
    payload.append("title", title);
    payload.append("category", form.category);
    payload.append("excerpt", excerpt);
    payload.append("content", form.content.trim());
    payload.append("status", form.status);
    form.images.forEach((image) => payload.append("images", image));
    if (editingId !== null) {
      payload.append("remove_image_ids", JSON.stringify(form.removeImageIds));
      if (form.removeLegacyCover) payload.append("remove_image", "true");
    }

    setSaving(true);
    setError("");
    setPageError("");
    try {
      const saved = await requestNews(editingId === null ? "" : `/${editingId}`, {
        method: editingId === null ? "POST" : "PUT",
        body: payload,
      });
      const article = fromApi(saved);
      setArticles((current) => {
        const updated = editingId === null
          ? [article, ...current]
          : current.map((item) => item.id === editingId ? article : item);
        return updated.sort((a, b) => b.date.localeCompare(a.date));
      });
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this article?")) return;
    setPageError("");
    try {
      await requestNews(`/${id}`, { method: "DELETE" });
      setArticles((current) => current.filter((article) => article.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      setPageError(err.message);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">CONTENT MANAGEMENT</span>
          <h1>News &amp; Articles</h1>
          <p>Share club updates, match reports, and stories with our supporters.</p>
        </div>
      </div>

      {pageError && <p className="admin-form-error" role="alert">{pageError}</p>}

      <div className="admin-player-stats admin-news-stats">
        <div className="admin-stat-card"><span className="admin-stat-label">Total Articles</span><strong>{articles.length}</strong><span className="admin-stat-note">All articles</span></div>
        <div className="admin-stat-card"><span className="admin-stat-label">Published</span><strong>{publishedCount}</strong><span className="admin-stat-note">Ready for readers</span></div>
        <div className="admin-stat-card"><span className="admin-stat-label">Drafts</span><strong>{draftCount}</strong><span className="admin-stat-note">Still in progress</span></div>
      </div>

      <section className="admin-form-card">
        <div className="admin-form-header">
          <div>
            <h2>{editingId !== null ? "Edit Article" : "Create Article"}</h2>
            <p>{editingId !== null ? "Update your article details below." : "Write something worth sharing with the Starehe FC family."}</p>
          </div>
          {editingId !== null && <button type="button" className="admin-secondary-button" onClick={resetForm} disabled={saving}>Cancel Edit</button>}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="admin-form-group admin-news-title-field">
              <label htmlFor="news-title">Headline *</label>
              <input id="news-title" name="title" value={form.title} onChange={handleChange} placeholder="Enter an article headline" maxLength={180} required />
            </div>
            <div className="admin-form-group">
              <label htmlFor="news-category">Category</label>
              <select id="news-category" name="category" value={form.category} onChange={handleChange}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div className="admin-form-group">
              <label htmlFor="news-status">Publication Status</label>
              <select id="news-status" name="status" value={form.status} onChange={handleChange}>
                <option value="Draft">Draft</option><option value="Published">Published</option>
              </select>
            </div>
            <div className="admin-form-group admin-news-excerpt-field">
              <label htmlFor="news-excerpt">Article Summary *</label>
              <textarea id="news-excerpt" name="excerpt" value={form.excerpt} onChange={handleChange} placeholder="Give readers a short introduction to this story..." rows={4} maxLength={500} required />
              <small>{form.excerpt.length}/500 characters</small>
            </div>
            <div className="admin-form-group admin-news-excerpt-field">
              <label htmlFor="news-content">Full Story</label>
              <textarea id="news-content" name="content" value={form.content} onChange={handleChange} placeholder="Write the full match report or club story here..." rows={8} />
              <small>Optional. If left blank, readers will see the article summary.</small>
            </div>
            <div className="admin-form-group admin-news-image-field">
              <label htmlFor="news-images">Article Photos</label>
              <input id="news-images" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleImageChange} />
              <small>Add up to 10 JPG, PNG, WebP, or GIF photos. Each photo can be up to 5 MB.</small>
              {(form.existingImages.length > 0 || form.images.length > 0) && (
                <div className="admin-news-gallery-preview">
                  {form.existingImages.map((image) => {
                    const removed = image.id === null ? form.removeLegacyCover : form.removeImageIds.includes(image.id);
                    if (removed) return null;
                    return (
                      <div className="admin-news-gallery-item" key={image.id ?? image.image_url}>
                        <img src={imageSource(image.image_url)} alt="Saved article photo" />
                        <button type="button" className="admin-delete-button" onClick={() => removeExistingImage(image)}>Remove</button>
                      </div>
                    );
                  })}
                  {form.images.map((image, index) => (
                    <div className="admin-news-gallery-item" key={`${image.name}-${image.lastModified}-${index}`}>
                      <span className="admin-news-file-name">{image.name}</span>
                      <button type="button" className="admin-delete-button" onClick={() => removeSelectedImage(index)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="admin-form-error" role="alert">{error}</p>}
          <div className="admin-form-actions">
            <button type="button" className="admin-secondary-button" onClick={resetForm} disabled={saving}>Clear Form</button>
            <button type="submit" className="admin-primary-button" disabled={saving}>{saving ? "Saving..." : editingId !== null ? "Save Changes" : "Create Article"}</button>
          </div>
        </form>
      </section>

      <section className="admin-news-library">
        <div className="admin-list-header">
          <div><h2>Article Library</h2><span className="admin-count">{filteredArticles.length} {filteredArticles.length === 1 ? "article" : "articles"}</span></div>
        </div>
        <div className="admin-player-filters admin-news-filters">
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search headlines, summaries..." aria-label="Search articles" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by publication status">
            <option value="All">All statuses</option><option value="Published">Published</option><option value="Draft">Drafts</option>
          </select>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter by category">
            <option value="All">All categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="admin-empty-state"><strong>Loading articles...</strong></div>
        ) : filteredArticles.length === 0 ? (
          <div className="admin-empty-state"><h3>No articles found</h3><p>{articles.length === 0 ? "Create an article to begin your library." : "Try another search or adjust your filters."}</p></div>
        ) : (
          <div className="admin-news-list">
            {filteredArticles.map((article) => (
              <article className="admin-news-card" key={article.id}>
                {article.imageUrl && <img className="admin-news-card-image" src={imageSource(article.imageUrl)} alt={article.title} />}
                <div className="admin-news-card-content">
                  <div className="admin-news-card-meta">
                    <span className="admin-news-category">{article.category}</span>
                    <span className={`admin-news-status ${article.status === "Published" ? "news-status-published" : "news-status-draft"}`}>{article.status}</span>
                  </div>
                  <h3>{article.title}</h3><p>{article.excerpt}</p><span className="admin-news-date">Updated {article.date}</span>
                </div>
                <div className="admin-news-actions">
                  <button type="button" className="admin-edit-button" onClick={() => handleEdit(article)}>Edit</button>
                  <button type="button" className="admin-delete-button" onClick={() => handleDelete(article.id)}>Delete</button>
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
