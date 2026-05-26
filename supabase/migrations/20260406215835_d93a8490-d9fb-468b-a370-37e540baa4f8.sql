
-- Allow authenticated users to read user_roles (needed to display roles)
CREATE POLICY "Authenticated can read user_roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to insert user_roles
CREATE POLICY "Admins can insert user_roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update user_roles
CREATE POLICY "Admins can update user_roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete user_roles
CREATE POLICY "Admins can delete user_roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
