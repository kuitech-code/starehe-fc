
BEGIN;

CREATE TABLE players (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    shirt_number SMALLINT NOT NULL UNIQUE
        CHECK (shirt_number BETWEEN 1 AND 99),
    position VARCHAR(20) NOT NULL
        CHECK (position IN ('Goalkeeper', 'Defender', 'Midfielder', 'Forward')),
    photo_url TEXT,
    bio TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fixtures (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    opponent VARCHAR(120) NOT NULL,
    match_date DATE NOT NULL,
    kickoff_time TIME,
    venue VARCHAR(200),
    competition VARCHAR(120),
    is_home BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled'
        CHECK (status IN ('Scheduled', 'Postponed', 'Cancelled', 'Completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE results (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fixture_id BIGINT UNIQUE REFERENCES fixtures(id) ON DELETE SET NULL,
    opponent VARCHAR(120) NOT NULL,
    match_date DATE NOT NULL,
    home_score SMALLINT NOT NULL CHECK (home_score >= 0),
    away_score SMALLINT NOT NULL CHECK (away_score >= 0),
    venue VARCHAR(200),
    competition VARCHAR(120),
    is_home BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE news_articles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    category VARCHAR(40) NOT NULL DEFAULT 'Club News'
        CHECK (category IN (
            'Club News',
            'Match Reports',
            'Team News',
            'Community',
            'Announcements'
        )),
    excerpt VARCHAR(500) NOT NULL,
    content TEXT,
    image_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft'
        CHECK (status IN ('Draft', 'Published')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_active_position
    ON players (is_active, position);

CREATE INDEX idx_fixtures_date
    ON fixtures (match_date);

CREATE INDEX idx_fixtures_status_date
    ON fixtures (status, match_date);

CREATE INDEX idx_results_date
    ON results (match_date DESC);

CREATE INDEX idx_news_status_published
    ON news_articles (status, published_at DESC);

COMMIT;
