-- Add show_ticket_volume to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS show_ticket_volume BOOLEAN DEFAULT false;
