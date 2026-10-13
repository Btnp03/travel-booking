-- Cassandra Schema for Travel Booking Analytics
-- Execute this CQL script in your Cassandra Cluster / DataStax Astra DB CQL Console

-- 1. Create Keyspace (Not needed in DataStax Astra DB if created via UI)
CREATE KEYSPACE IF NOT EXISTS travel_analytics
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE travel_analytics;

-- 2. Table for Page Views (Partitioned by page_url and date for efficient daily dashboard queries)
CREATE TABLE IF NOT EXISTS page_views (
    page_url text,
    date text, -- YYYY-MM-DD
    timestamp timestamp,
    event_id uuid,
    user_id text,
    session_id text,
    referrer text,
    user_agent text,
    ip_address text,
    metadata text, -- JSON payload string for extra properties
    PRIMARY KEY ((page_url, date), timestamp, event_id)
) WITH CLUSTERING ORDER BY (timestamp DESC, event_id ASC);

-- 3. Table for User Events (Track actions: SEARCH, CLICK, BOOKING_START, BOOKING_COMPLETE)
CREATE TABLE IF NOT EXISTS user_events (
    event_type text,
    date text, -- YYYY-MM-DD
    timestamp timestamp,
    event_id uuid,
    user_id text,
    session_id text,
    page_url text,
    event_data text, -- JSON payload string
    PRIMARY KEY ((event_type, date), timestamp, event_id)
) WITH CLUSTERING ORDER BY (timestamp DESC, event_id ASC);

-- 4. Table for User Activity (Query history of events for a specific user)
CREATE TABLE IF NOT EXISTS user_activity (
    user_id text,
    timestamp timestamp,
    event_id uuid,
    event_type text,
    page_url text,
    event_data text,
    PRIMARY KEY (user_id, timestamp, event_id)
) WITH CLUSTERING ORDER BY (timestamp DESC, event_id ASC);

-- 5. Counter Table for Daily Aggregated Page Views (Fast counter for dashboard overview)
CREATE TABLE IF NOT EXISTS daily_page_counts (
    page_url text,
    date text,
    views counter,
    PRIMARY KEY (page_url, date)
);
