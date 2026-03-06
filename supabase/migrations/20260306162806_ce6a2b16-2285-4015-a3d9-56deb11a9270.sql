-- Clean up stale rejected connection records where a newer accepted/pending record exists between the same pair
DELETE FROM user_connections uc1
WHERE uc1.status = 'rejected'
AND EXISTS (
  SELECT 1 FROM user_connections uc2
  WHERE uc2.id != uc1.id
  AND uc2.status IN ('accepted', 'pending')
  AND (
    (uc2.requester_id = uc1.requester_id AND uc2.receiver_id = uc1.receiver_id)
    OR (uc2.requester_id = uc1.receiver_id AND uc2.receiver_id = uc1.requester_id)
  )
);