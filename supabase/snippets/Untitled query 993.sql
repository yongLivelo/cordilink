  insert into public.profiles (id, role)
  -- Notice the explicit public. prefix on both the table and the enum
  values (new.id, 'user'::public.role_type);
  
  return new;
-- 5. Attach the trigger to the auth.users table
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();