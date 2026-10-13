BEGIN;

CREATE TABLE league_teams (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_league_teams_name_lower
    ON league_teams (LOWER(name));

CREATE TABLE league_matches (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    home_team_id BIGINT NOT NULL REFERENCES league_teams(id) ON DELETE RESTRICT,
    away_team_id BIGINT NOT NULL REFERENCES league_teams(id) ON DELETE RESTRICT,
    match_date DATE NOT NULL,
    home_score SMALLINT NOT NULL CHECK (home_score >= 0),
    away_score SMALLINT NOT NULL CHECK (away_score >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (home_team_id <> away_team_id)
);

CREATE INDEX idx_league_matches_date ON league_matches (match_date DESC);
CREATE INDEX idx_league_matches_home_team ON league_matches (home_team_id);
CREATE INDEX idx_league_matches_away_team ON league_matches (away_team_id);

INSERT INTO league_teams (name)
SELECT DISTINCT ON (LOWER(team_name)) team_name
FROM (
    SELECT 'Starehe FC'::VARCHAR(120) AS team_name
    UNION ALL
    SELECT opponent FROM results WHERE competition = 'League Match'
) AS existing_teams
WHERE team_name IS NOT NULL AND BTRIM(team_name) <> ''
ORDER BY LOWER(team_name), team_name
ON CONFLICT DO NOTHING;

COMMIT;
