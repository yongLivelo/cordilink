create extension if not exists pgcrypto;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-2222-3333-4444-555555555555', 
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('password123', gen_salt('bf')), 
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  -- Set them all to empty strings:
  '',
  '',
  '',
  ''
);

insert into public.profiles (id, role)
values (
  '11111111-2222-3333-4444-555555555555',
  'admin'::public.role_type
)
on conflict (id) do update set role = excluded.role;
