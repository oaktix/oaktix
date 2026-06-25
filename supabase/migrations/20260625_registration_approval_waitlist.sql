-- Luma-style registration approval + capacity waitlist for FREE events.

-- Events: opt-in approval gate and waitlist toggle.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_waitlist   boolean DEFAULT false;

-- Tickets: per-registration approval status.
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS registration_status text
    CHECK (registration_status IN ('approved', 'pending', 'waitlist', 'rejected'))
    DEFAULT 'approved';

-- Backfill existing rows so historical tickets count as approved.
UPDATE tickets SET registration_status = 'approved' WHERE registration_status IS NULL;

-- Index to speed up approved-count capacity checks per event.
CREATE INDEX IF NOT EXISTS idx_tickets_event_registration_status
  ON tickets (event_id, registration_status);
