-- Allow requester to delete rejected connection records (for cool-down re-send flow)
CREATE POLICY "Requester can delete rejected connections"
ON public.user_connections
FOR DELETE
USING (requester_id = auth.uid() AND status = 'rejected');