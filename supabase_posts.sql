-- SQL for Posts Table and RLS
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT,
    category TEXT CHECK (category IN ('berita', 'agenda', 'pengumuman')) DEFAULT 'berita',
    image_url TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published posts
DROP POLICY IF EXISTS "Allow public read for published posts" ON posts;
CREATE POLICY "Allow public read for published posts" 
ON posts FOR SELECT 
USING (is_published = true);

-- Policy: Operators can manage their OWN school posts
DROP POLICY IF EXISTS "Operators can manage own posts" ON posts;
CREATE POLICY "Operators can manage own posts" 
ON posts FOR ALL 
USING (
  org_id IN (
    SELECT org_id FROM school_data 
    WHERE npsn IN (SELECT npsn FROM profiles WHERE id = auth.uid())
  )
);

-- Policy: Admin Kecamatan can manage ALL posts
DROP POLICY IF EXISTS "Admin Kecamatan can manage all posts" ON posts;
CREATE POLICY "Admin Kecamatan can manage all posts" 
ON posts FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin_kecamatan'
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql' SET search_path = public;

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
