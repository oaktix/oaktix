-- Migration: Create saved_events table and RLS policies

CREATE TABLE IF NOT EXISTS public.saved_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Enable Row Level Security
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own saved events" 
  ON public.saved_events 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved events" 
  ON public.saved_events 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved events" 
  ON public.saved_events 
  FOR DELETE 
  USING (auth.uid() = user_id);
