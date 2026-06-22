-- Email campaign analytics
-- Tracks bulk/individual campaigns sent from the admin CRM

CREATE TABLE IF NOT EXISTS email_campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject       TEXT NOT NULL,
  target        TEXT NOT NULL,                        -- 'all' | 'attendees' | 'vendors' | 'professionals' | 'individual'
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count    INTEGER NOT NULL DEFAULT 0,
  failed_count  INTEGER NOT NULL DEFAULT 0,
  sent_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_campaign_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  event_type     TEXT NOT NULL CHECK (event_type IN ('sent', 'opened')),
  tracking_token TEXT UNIQUE,    -- used to correlate tracking pixel hits
  opened_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign_id   ON email_campaign_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_events_tracking_token ON email_campaign_events(tracking_token);

-- Admins can read/write
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_campaigns" ON email_campaigns
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "admins_manage_campaign_events" ON email_campaign_events
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
