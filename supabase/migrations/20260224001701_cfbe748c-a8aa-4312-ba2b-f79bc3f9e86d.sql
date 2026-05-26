-- Confirm email for orphaned user
UPDATE auth.users 
SET email_confirmed_at = now(), 
    updated_at = now()
WHERE email = 'dkamotos@hotmail.com' AND email_confirmed_at IS NULL;