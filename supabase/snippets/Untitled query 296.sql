update auth.users set confirmation_token = '' where confirmation_token is null;
update auth.users set email_change_token_new = '' where email_change_token_new is null;
update auth.users set recovery_token = '' where recovery_token is null;
update auth.users set email_change = '' where email_change is null;