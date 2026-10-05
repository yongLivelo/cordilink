CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES ('00000000-0000-0000-0000-000000000000', '11111111-2222-3333-4444-555555555555', 'authenticated', 'authenticated', 'admin@cordilink.gov', crypt('123456', gen_salt('bf')), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '{"provider":"email","providers":["email"]}', '{}', FALSE, '', '', '', '');

INSERT INTO public.profile (id, role)
    VALUES ('11111111-2222-3333-4444-555555555555', 'admin')
ON CONFLICT (id)
    DO UPDATE SET ROLE = excluded.role;

