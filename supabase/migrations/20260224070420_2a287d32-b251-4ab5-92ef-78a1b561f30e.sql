
-- Create a storage bucket for content images (events and resources)
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-images', 'content-images', true);

-- Allow anyone to view content images (public bucket)
CREATE POLICY "Content images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-images');

-- Allow authenticated users to upload content images
CREATE POLICY "Authenticated users can upload content images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'content-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update content images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'content-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete content images"
ON storage.objects FOR DELETE
USING (bucket_id = 'content-images' AND auth.role() = 'authenticated');
