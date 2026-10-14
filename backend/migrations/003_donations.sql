BEGIN;

CREATE TABLE donations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_reference UUID NOT NULL UNIQUE,
    amount INTEGER NOT NULL CHECK (amount BETWEEN 1 AND 250000),
    currency CHAR(3) NOT NULL DEFAULT 'KES' CHECK (currency = 'KES'),
    phone_number VARCHAR(12) NOT NULL
        CHECK (phone_number ~ '^254[17][0-9]{8}$'),
    status VARCHAR(20) NOT NULL DEFAULT 'Initiated'
        CHECK (status IN ('Initiated', 'Pending', 'Completed', 'Failed')),
    merchant_request_id VARCHAR(120),
    checkout_request_id VARCHAR(120) UNIQUE,
    mpesa_receipt_number VARCHAR(32) UNIQUE,
    provider_result_code INTEGER,
    provider_result_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_donations_status_created
    ON donations (status, created_at DESC);

COMMIT;
