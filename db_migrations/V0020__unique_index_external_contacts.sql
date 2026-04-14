CREATE UNIQUE INDEX IF NOT EXISTS idx_ext_contacts_owner_linked 
ON t_p35508816_friend_app_developme.external_contacts (owner_id, linked_user_id)
WHERE linked_user_id IS NOT NULL;
