-- Migration 008: Add servings column to recipe_details
ALTER TABLE recipe_details ADD COLUMN IF NOT EXISTS servings INTEGER DEFAULT 4;
ALTER TABLE extra_recipes ADD COLUMN IF NOT EXISTS servings INTEGER DEFAULT 4;
-- trigger
