-- Create the follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can't follow themselves
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  
  -- Ensure unique follow relationships
  UNIQUE(follower_id, following_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Create policies for the follows table
-- Users can insert their own follows
CREATE POLICY "Users can create their own follows" ON follows
  FOR INSERT WITH CHECK (follower_id = current_user);

-- Users can view follows they're involved in
CREATE POLICY "Users can view follows they're involved in" ON follows
  FOR SELECT USING (
    follower_id = current_user OR 
    following_id = current_user
  );

-- Users can delete their own follows
CREATE POLICY "Users can delete their own follows" ON follows
  FOR DELETE USING (follower_id = current_user);

-- Create a function to get follow counts
CREATE OR REPLACE FUNCTION get_follow_counts(user_id TEXT)
RETURNS TABLE(followers_count BIGINT, following_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM follows WHERE following_id = user_id) as followers_count,
    (SELECT COUNT(*) FROM follows WHERE follower_id = user_id) as following_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON follows TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_follow_counts(TEXT) TO anon, authenticated; 