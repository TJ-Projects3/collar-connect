
-- Function to extract and rank trending hashtags from posts in the last 7 days
CREATE OR REPLACE FUNCTION public.get_trending_hashtags(limit_count integer DEFAULT 5)
RETURNS TABLE(hashtag text, post_count bigint)
LANGUAGE sql STABLE
SET search_path TO 'public'
AS $$
  SELECT
    lower(match[1]) AS hashtag,
    count(DISTINCT p.id) AS post_count
  FROM posts p,
       LATERAL regexp_matches(p.content, '#([A-Za-z0-9_]+)', 'g') AS match
  WHERE p.created_at >= now() - interval '7 days'
  GROUP BY lower(match[1])
  ORDER BY post_count DESC, hashtag ASC
  LIMIT limit_count;
$$;
