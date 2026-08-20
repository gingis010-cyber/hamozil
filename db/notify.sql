-- ============================================================================
--  התראה על נרשם חדש — לשני הטלפונים
--  להרצה אחרי schema.sql
--
--  למה זה נדרש בכלל: לחיצה אחת של גולש פותחת שיחת וואטסאפ אחת בלבד.
--  אי אפשר לגרום להודעה שהוא שולח להגיע לשני מספרים. לכן ההתראה
--  נשלחת מהשרת, מיד אחרי שהשורה נכנסת לטבלה — וכך היא מגיעה לשני
--  המספרים, עם כל הפרטים, וגם אם הגולש מעולם לא לחץ "שלח".
-- ============================================================================

create table if not exists public.hamozil_notify (
  id       bigint generated always as identity primary key,
  label    text not null,          -- שם מזהה, לנוחות בלבד
  phone    text not null,          -- בפורמט בינלאומי, בלי +
  api_key  text,                   -- מפתח ההתראות של אותו מספר
  active   boolean not null default true
);

alter table public.hamozil_notify enable row level security;
-- אין שום מדיניות: הטבלה נגישה רק לשרת. הדף הציבורי לא יכול לגעת בה.

insert into public.hamozil_notify (label, phone) values
  ('המספר הראשי',  '972506911937'),
  ('מספר נוסף',    '972548087067')
on conflict do nothing;

select label, phone, active from public.hamozil_notify order by id;
