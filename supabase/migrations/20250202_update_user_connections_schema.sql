-- Rename columns in user_connections to use requester/receiver pattern
ALTER TABLE user_connections 
  RENAME COLUMN user_id TO requester_id;

ALTER TABLE user_connections 
  RENAME COLUMN connected_user_id TO receiver_id;

-- Update foreign key names if needed (optional, for clarity)
-- The foreign keys will still work with the renamed columns
