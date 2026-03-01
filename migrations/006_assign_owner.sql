-- Run this in Supabase SQL editor AFTER you sign in to the app for the first time.
-- Replace 'YOUR-USER-ID-HERE' with your actual user ID from: 
-- Supabase Dashboard → Authentication → Users → click your user → copy the UUID

-- Step 1: Find your user ID (run this first to see it)
-- SELECT id, email FROM auth.users;

-- Step 2: Assign all existing recipes to you
UPDATE recipes SET user_id = 'YOUR-USER-ID-HERE' WHERE user_id IS NULL;
UPDATE recipe_details SET user_id = 'YOUR-USER-ID-HERE' WHERE user_id IS NULL;
UPDATE recipe_ingredients SET user_id = 'YOUR-USER-ID-HERE' WHERE user_id IS NULL;

-- Step 3: Verify
SELECT COUNT(*) as total, COUNT(user_id) as with_user FROM recipes;
