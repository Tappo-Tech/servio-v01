-- ترحيل قاعدة البيانات `categories separate print`؛ راجع أوامر SQL أدناه لمعرفة التغيير الدقيق.
alter table public.categories
  add column if not exists separate_print boolean not null default false;

comment on column public.categories.separate_print is
  'When true, items in this category are printed on a receipt separate from the rest of the order.';
