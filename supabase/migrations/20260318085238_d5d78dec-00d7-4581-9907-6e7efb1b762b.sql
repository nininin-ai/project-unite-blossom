
-- Create assets table
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'Bureau',
  total_surface NUMERIC NOT NULL DEFAULT 0,
  vacant_surface NUMERIC NOT NULL DEFAULT 0,
  acquisition_price NUMERIC NOT NULL DEFAULT 0,
  acquisition_date TEXT NOT NULL DEFAULT '',
  construction_year INTEGER NOT NULL DEFAULT 2000,
  is_copropriete BOOLEAN NOT NULL DEFAULT false,
  last_works TEXT NOT NULL DEFAULT '',
  annual_rent NUMERIC NOT NULL DEFAULT 0,
  yield NUMERIC NOT NULL DEFAULT 0,
  risk_score NUMERIC NOT NULL DEFAULT 50,
  tenants JSONB NOT NULL DEFAULT '[]'::jsonb,
  charges JSONB NOT NULL DEFAULT '[]'::jsonb,
  floors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own assets" ON public.assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assets" ON public.assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assets" ON public.assets FOR DELETE USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
