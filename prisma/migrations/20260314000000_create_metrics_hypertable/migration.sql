-- 1. Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 2. Create the metrics table
CREATE TABLE metrics (
  id              BIGSERIAL       NOT NULL,
  user_id         UUID            NOT NULL,
  type            VARCHAR(255)    NOT NULL,
  date            TIMESTAMPTZ     NOT NULL,
  value           DECIMAL(10,2)   NOT NULL,
  original_value  DECIMAL(10,2)   NOT NULL,
  original_unit   VARCHAR(20)     NOT NULL,
  created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP
);

-- 3. Composite PK required by TimescaleDB (partition column must be in any unique constraint)
ALTER TABLE metrics ADD PRIMARY KEY (id, date);

-- 4. Convert to a TimescaleDB hypertable with 1-month chunks
SELECT create_hypertable('metrics', 'date', chunk_time_interval => INTERVAL '1 month');

-- 5. Composite index for dashboard query patterns (user + type + time range)
CREATE INDEX idx_metrics_user_type_date
  ON metrics (user_id, type, date DESC);

-- 6. Automated retention policy — drop chunks older than 1 year
SELECT add_retention_policy('metrics', INTERVAL '1 year');
