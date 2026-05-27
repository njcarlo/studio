create policy "Authenticated users can insert tract_users"
  on public.tract_users
  for insert
  using (auth.role() = 'authenticated');
