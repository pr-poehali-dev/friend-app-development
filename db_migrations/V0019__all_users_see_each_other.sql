-- Все пользователи видят всех: добавляем недостающие пары в external_contacts
INSERT INTO t_p35508816_friend_app_developme.external_contacts 
  (owner_id, display_name, avatar_initials, source, linked_user_id)
SELECT 
  u1.id AS owner_id,
  u2.display_name,
  u2.avatar_initials,
  'system' AS source,
  u2.id AS linked_user_id
FROM t_p35508816_friend_app_developme.users u1
CROSS JOIN t_p35508816_friend_app_developme.users u2
WHERE u1.id != u2.id
  AND NOT EXISTS (
    SELECT 1 FROM t_p35508816_friend_app_developme.external_contacts ec
    WHERE ec.owner_id = u1.id AND ec.linked_user_id = u2.id
  );
