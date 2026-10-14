BEGIN;

ALTER TABLE league_teams
    ADD COLUMN logo_url TEXT;

COMMIT;
