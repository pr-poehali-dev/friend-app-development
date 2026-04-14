-- Добавить Елену Келину (id=10) в контакты Константина (id=7) и обратно
INSERT INTO t_p35508816_friend_app_developme.external_contacts 
  (owner_id, display_name, avatar_initials, source, linked_user_id)
SELECT 7, display_name, avatar_initials, 'invite', id 
FROM t_p35508816_friend_app_developme.users WHERE id = 10
ON CONFLICT DO NOTHING;

INSERT INTO t_p35508816_friend_app_developme.external_contacts 
  (owner_id, display_name, avatar_initials, source, linked_user_id)
SELECT 10, display_name, avatar_initials, 'invite', id 
FROM t_p35508816_friend_app_developme.users WHERE id = 7
ON CONFLICT DO NOTHING;
