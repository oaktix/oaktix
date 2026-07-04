-- Add deleted_at for soft deletion
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
