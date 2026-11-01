BEGIN;

ALTER TABLE results
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'Normal'
        CHECK (status IN (
            'Normal',
            'Cancelled',
            'Postponed',
            'Home walkover',
            'Away walkover',
            'Home win penalties',
            'Away win penalties',
            'Abandoned',
            'Void'
        ));

COMMIT;
