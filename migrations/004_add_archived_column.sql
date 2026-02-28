-- Add archived column to extra_recipes
ALTER TABLE extra_recipes ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
