BEGIN;

CREATE TABLE news_article_images (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    news_article_id BIGINT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_news_article_images_order
    ON news_article_images (news_article_id, display_order, id);

-- Keep existing featured images visible in each article's image gallery.
INSERT INTO news_article_images (news_article_id, image_url, display_order)
SELECT id, image_url, 0
FROM news_articles
WHERE image_url IS NOT NULL AND BTRIM(image_url) <> '';

COMMIT;
