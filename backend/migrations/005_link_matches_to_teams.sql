BEGIN;

ALTER TABLE fixtures
    ADD COLUMN opponent_team_id BIGINT;

ALTER TABLE results
    ADD COLUMN opponent_team_id BIGINT;

-- Preserve existing opponents by ensuring each one has a shared team record.
INSERT INTO league_teams (name)
SELECT DISTINCT ON (LOWER(BTRIM(opponent))) BTRIM(opponent)
FROM (
    SELECT opponent FROM fixtures
    UNION ALL
    SELECT opponent FROM results
) AS existing_opponents
WHERE opponent IS NOT NULL AND BTRIM(opponent) <> ''
ORDER BY LOWER(BTRIM(opponent)), BTRIM(opponent)
ON CONFLICT DO NOTHING;

UPDATE fixtures AS fixture
SET opponent_team_id = team.id,
    opponent = team.name
FROM league_teams AS team
WHERE LOWER(BTRIM(fixture.opponent)) = LOWER(team.name);

UPDATE results AS result
SET opponent_team_id = team.id,
    opponent = team.name
FROM league_teams AS team
WHERE LOWER(BTRIM(result.opponent)) = LOWER(team.name);

ALTER TABLE fixtures
    ALTER COLUMN opponent_team_id SET NOT NULL,
    ADD CONSTRAINT fixtures_opponent_team_fk
        FOREIGN KEY (opponent_team_id) REFERENCES league_teams(id) ON DELETE RESTRICT;

ALTER TABLE results
    ALTER COLUMN opponent_team_id SET NOT NULL,
    ADD CONSTRAINT results_opponent_team_fk
        FOREIGN KEY (opponent_team_id) REFERENCES league_teams(id) ON DELETE RESTRICT;

CREATE INDEX idx_fixtures_opponent_team ON fixtures (opponent_team_id);
CREATE INDEX idx_results_opponent_team ON results (opponent_team_id);

COMMIT;
