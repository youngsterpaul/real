-- Test if hotels can be seen by public (simulate anonymous access)
-- First, let's verify current RLS status
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('hotels', 'adventure_places', 'attractions', 'trips')
ORDER BY tablename, policyname;