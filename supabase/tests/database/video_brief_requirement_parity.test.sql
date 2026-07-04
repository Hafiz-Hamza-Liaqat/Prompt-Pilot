begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

select is(
  (
    select count(*)::int
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'video_briefs'
      and column_name like 'requires\_%'
  ),
  14,
  'exactly 14 requires_* columns exist on public.video_briefs'
);

select set_eq(
  $$
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'video_briefs'
      and column_name like 'requires\_%'
    order by column_name
  $$,
  $$
    values
      ('requires_camera_control'),
      ('requires_character_consistency'),
      ('requires_commercial_use'),
      ('requires_dialogue'),
      ('requires_exact_text_visibility'),
      ('requires_first_last_frame_control'),
      ('requires_lip_sync'),
      ('requires_logo_accuracy'),
      ('requires_multiple_locations'),
      ('requires_native_audio'),
      ('requires_product_consistency'),
      ('requires_reference_images'),
      ('requires_video_extension'),
      ('requires_voiceover')
  $$,
  'requires_* column names match the approved database columns'
);

select is(
  (
    select count(*)::int
    from information_schema.columns c
    join pg_catalog.pg_class cls
      on cls.relname = c.table_name
    join pg_catalog.pg_namespace ns
      on ns.oid = cls.relnamespace
      and ns.nspname = c.table_schema
    join pg_catalog.pg_attribute att
      on att.attrelid = cls.oid
      and att.attname = c.column_name
      and att.attnum > 0
      and not att.attisdropped
    join pg_catalog.pg_type typ
      on typ.oid = att.atttypid
    where c.table_schema = 'public'
      and c.table_name = 'video_briefs'
      and c.column_name like 'requires\_%'
      and typ.typname = 'bool'
  ),
  14,
  'every requirement column is boolean'
);

select is(
  (
    select count(*)::int
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'video_briefs'
      and column_name like 'requires\_%'
      and is_nullable = 'NO'
  ),
  14,
  'every requirement column is non-null'
);

select is(
  (
    select count(*)::int
    from pg_catalog.pg_attribute att
    join pg_catalog.pg_class cls on cls.oid = att.attrelid
    join pg_catalog.pg_namespace ns on ns.oid = cls.relnamespace
    join pg_catalog.pg_attrdef def on def.adrelid = att.attrelid and def.adnum = att.attnum
    where ns.nspname = 'public'
      and cls.relname = 'video_briefs'
      and att.attname like 'requires\_%'
      and att.attnum > 0
      and not att.attisdropped
      and pg_catalog.pg_get_expr(def.adbin, def.adrelid) = 'false'
  ),
  14,
  'every requirement column defaults to false'
);

select is(
  (
    select count(*)::int
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'video_briefs'
      and column_name like 'requires\_%'
      and column_name not in (
        'requires_camera_control',
        'requires_character_consistency',
        'requires_commercial_use',
        'requires_dialogue',
        'requires_exact_text_visibility',
        'requires_first_last_frame_control',
        'requires_lip_sync',
        'requires_logo_accuracy',
        'requires_multiple_locations',
        'requires_native_audio',
        'requires_product_consistency',
        'requires_reference_images',
        'requires_video_extension',
        'requires_voiceover'
      )
  ),
  0,
  'no unknown requires_* column exists'
);

select ok(
  has_column_privilege(
    'authenticated',
    'public.video_briefs',
    'requires_voiceover',
    'UPDATE'
  ),
  'authenticated update grant covers requirement columns'
);

select ok(
  not has_column_privilege(
    'authenticated',
    'public.video_briefs',
    'completed_at',
    'UPDATE'
  ),
  'no direct update grant exists for completed_at'
);

select ok(
  not has_column_privilege(
    'authenticated',
    'public.video_briefs',
    'project_id',
    'UPDATE'
  ),
  'no direct update grant exists for project_id'
);

select * from finish();

rollback;
