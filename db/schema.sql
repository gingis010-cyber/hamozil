-- ============================================================================
--  קבוצת המוזיל — טבלת הנרשמים
--  להרצה פעם אחת ב-Supabase → SQL Editor → Run
-- ============================================================================

create table if not exists public.hamozil_leads (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),

  side         text not null default 'business',  -- business | private
  full_name    text not null,
  phone        text not null,
  email        text,

  biz_type     text,      -- סוג העסק
  turnover     numeric,   -- מחזור חודשי בכרטיסי אשראי
  rate         numeric,   -- העמלה שמשלמים היום, באחוזים
  power_bill   numeric,   -- חשבון החשמל החודשי (משקי בית)
  power_supp   text,      -- ספק החשמל הנוכחי

  referred_by  text,      -- מי הפנה אותו אלינו (?ref=)
  page_url     text,      -- מאיפה הגיע, כולל פרמטרי קמפיין

  status       text not null default 'חדש',
  notes        text
);

create index if not exists hamozil_leads_created_idx
  on public.hamozil_leads (created_at desc);

-- ----------------------------------------------------------------------------
--  אבטחה
--
--  המפתח הציבורי של הפרויקט מוטמע בדף הנחיתה, ולכן כל אדם יכול לקרוא
--  אותו מקוד המקור. לכן ההרשאה האנונימית היחידה היא הכנסת שורה — אין
--  ולא תהיה הרשאת קריאה. גם מי שימצא את המפתח לא יוכל למשוך את רשימת
--  הטלפונים של הנרשמים.
-- ----------------------------------------------------------------------------
alter table public.hamozil_leads enable row level security;

drop policy if exists "site can insert" on public.hamozil_leads;
create policy "site can insert"
  on public.hamozil_leads
  for insert
  to anon
  with check (
    length(coalesce(full_name, '')) between 2 and 80 and
    length(coalesce(phone, ''))     between 7 and 20 and
    side in ('business', 'private')
  );

-- בדיקה מהירה שהכל נוצר כמו שצריך
select 'הטבלה מוכנה' as status, count(*) as nirshamim from public.hamozil_leads;
