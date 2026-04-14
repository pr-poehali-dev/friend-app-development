-- Убрать admin у всех кроме Константина Шнюкова (Boss_OT, id=7)
UPDATE t_p35508816_friend_app_developme.users 
SET role = 'user' 
WHERE username != 'Boss_OT';
