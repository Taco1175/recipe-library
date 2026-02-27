-- ============================================================
-- STRUCTURED INGREDIENTS MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create the new structured ingredients table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  amount NUMERIC,           -- e.g. 1.5, 0.25, 3
  amount_fraction TEXT,     -- e.g. '1/2', '3/4' for display
  measurement TEXT,         -- e.g. 'cup', 'tbsp', 'lb', 'clove', 'oz'
  ingredient TEXT NOT NULL, -- e.g. 'garlic', 'chicken breast'
  notes TEXT,               -- e.g. 'minced', 'diced', 'softened'
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON recipe_ingredients FOR SELECT USING (true);
CREATE POLICY "Public insert" ON recipe_ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON recipe_ingredients FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON recipe_ingredients FOR DELETE USING (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);

-- ============================================================
-- 2. INSERT structured ingredients for all recipes
-- ============================================================

INSERT INTO recipe_ingredients (recipe_id, amount, amount_fraction, measurement, ingredient, notes, sort_order) VALUES

-- ============================================================
-- RECIPE 1: Freezer Breakfast Burritos (Flexible Dieting Lifestyle)
-- ============================================================
(1, 1, null, 'lb', 'ground sausage', 'turkey or pork', 1),
(1, 6, null, null, 'eggs', 'large', 2),
(1, 1, null, null, 'green bell pepper', 'diced', 3),
(1, 1, null, null, 'yellow onion', 'diced', 4),
(1, 1, null, 'cup', 'shredded cheddar cheese', null, 5),
(1, 8, null, null, 'flour tortillas', 'large (10-inch)', 6),
(1, 1, null, 'cup', 'tater tots', 'baked', 7),

-- ============================================================
-- RECIPE 2: Meal Prep Breakfast Burritos (Kay Nutrition)
-- ============================================================
(2, 8, null, null, 'eggs', 'large', 1),
(2, 1, null, 'can (15oz)', 'black beans', 'drained and rinsed', 2),
(2, 1, null, null, 'red bell pepper', 'diced', 3),
(2, 1, null, null, 'green bell pepper', 'diced', 4),
(2, 1, null, null, 'onion', 'small, diced', 5),
(2, 1, null, 'cup', 'shredded cheddar cheese', null, 6),
(2, 8, null, null, 'flour tortillas', 'large', 7),
(2, 1, null, 'tbsp', 'olive oil', null, 8),
(2, 1, null, 'tsp', 'cumin', null, 9),
(2, 1, null, 'tsp', 'chili powder', null, 10),

-- ============================================================
-- RECIPE 3: Veggie-Loaded Egg Scramble (Awaken180)
-- ============================================================
(3, 3, null, null, 'eggs', 'large', 1),
(3, 1, null, 'cup', 'fresh spinach', null, 2),
(3, 0.5, '1/2', 'cup', 'bell pepper', 'diced', 3),
(3, 0.25, '1/4', 'cup', 'onion', 'diced', 4),
(3, 0.25, '1/4', 'cup', 'mushrooms', 'sliced', 5),
(3, 0.25, '1/4', 'cup', 'cherry tomatoes', 'halved', 6),
(3, 1, null, 'tsp', 'olive oil', null, 7),

-- ============================================================
-- RECIPE 4: Protein Yogurt Bowl (Awaken180)
-- ============================================================
(4, 1, null, 'cup', 'plain non-fat Greek yogurt', null, 1),
(4, 1, null, 'scoop', 'vanilla protein powder', null, 2),
(4, 0.5, '1/2', 'cup', 'fresh berries', 'strawberries, blueberries, or raspberries', 3),
(4, 1, null, 'tbsp', 'granola', null, 4),
(4, 1, null, 'tsp', 'honey', 'optional', 5),

-- ============================================================
-- RECIPE 5: Cauliflower & Egg Fried Rice Breakfast Bowl (Awaken180)
-- ============================================================
(5, 2, null, 'cups', 'riced cauliflower', 'fresh or frozen', 1),
(5, 3, null, null, 'eggs', 'large', 2),
(5, 2, null, 'tbsp', 'low-sodium soy sauce', null, 3),
(5, 1, null, 'tsp', 'sesame oil', null, 4),
(5, 0.5, '1/2', 'cup', 'frozen peas and carrots', null, 5),
(5, 2, null, null, 'green onions', 'sliced', 6),
(5, 1, null, 'tsp', 'garlic powder', null, 7),

-- ============================================================
-- RECIPE 6: Savory Egg Muffin Veggie Bake (Awaken180)
-- ============================================================
(6, 8, null, null, 'eggs', 'large', 1),
(6, 0.25, '1/4', 'cup', 'milk', null, 2),
(6, 1, null, 'cup', 'bell peppers', 'mixed colors, diced', 3),
(6, 0.5, '1/2', 'cup', 'onion', 'diced', 4),
(6, 1, null, 'cup', 'fresh spinach', 'chopped', 5),
(6, 0.25, '1/4', 'cup', 'shredded cheddar cheese', null, 6),
(6, 0.5, '1/2', 'tsp', 'garlic powder', null, 7),
(6, 0.5, '1/2', 'tsp', 'Italian seasoning', null, 8),

-- ============================================================
-- RECIPE 7: Spinach Breakfast Casserole (Kay Nutrition)
-- ============================================================
(7, 12, null, null, 'eggs', 'large', 1),
(7, 1, null, 'lb', 'baby potatoes', 'diced', 2),
(7, 3, null, 'cups', 'fresh spinach', null, 3),
(7, 1, null, null, 'leek', 'white and light green parts, diced', 4),
(7, 1, null, 'cup', 'sharp cheddar cheese', 'shredded', 5),
(7, 1, null, 'tbsp', 'butter', null, 6),
(7, 1, null, 'tbsp', 'olive oil', null, 7),

-- ============================================================
-- RECIPE 8: Breakfast Egg Bake (Kay Nutrition)
-- ============================================================
(8, 10, null, null, 'eggs', 'large', 1),
(8, 1, null, 'lb', 'breakfast sausage', 'pork or turkey', 2),
(8, 2, null, 'cups', 'potatoes', 'diced small', 3),
(8, 1, null, null, 'red bell pepper', 'diced', 4),
(8, 1, null, null, 'green bell pepper', 'diced', 5),
(8, 1, null, null, 'onion', 'small, diced', 6),
(8, 1, null, 'cup', 'shredded cheddar cheese', null, 7),

-- ============================================================
-- RECIPE 9: Spinach Egg Muffins with Feta (Kay Nutrition)
-- ============================================================
(9, 8, null, null, 'eggs', 'large', 1),
(9, 2, null, 'cups', 'fresh spinach', 'roughly chopped', 2),
(9, 0.5, '1/2', 'cup', 'feta cheese', 'crumbled', 3),

-- ============================================================
-- RECIPE 10: Bacon Egg Muffin Cups (Kay Nutrition)
-- ============================================================
(10, 12, null, null, 'strips bacon', 'turkey or regular', 1),
(10, 12, null, null, 'eggs', 'large', 2),
(10, 1, null, 'cup', 'mushrooms', 'sliced', 3),

-- ============================================================
-- RECIPE 11: Greek Omelette Casserole (Kay Nutrition)
-- ============================================================
(11, 8, null, null, 'eggs', 'large', 1),
(11, 0.5, '1/2', 'cup', 'feta cheese', 'crumbled', 2),
(11, 0.5, '1/2', 'cup', 'Kalamata olives', 'sliced', 3),
(11, 1, null, 'cup', 'cherry tomatoes', 'halved', 4),
(11, 1, null, null, 'onion', 'small, diced', 5),
(11, 2, null, 'cups', 'fresh spinach', null, 6),
(11, 1, null, 'tsp', 'dried oregano', null, 7),
(11, 1, null, 'tbsp', 'olive oil', null, 8),

-- ============================================================
-- RECIPE 12: Egg Muffins with Red Pepper & Spinach (Kay Nutrition)
-- ============================================================
(12, 8, null, null, 'eggs', 'large', 1),
(12, 1, null, null, 'red bell pepper', 'finely diced', 2),
(12, 1, null, 'cup', 'fresh spinach', 'roughly chopped', 3),
(12, 0.5, '1/2', 'cup', 'shredded cheddar cheese', null, 4),

-- ============================================================
-- RECIPE 13: Big Chicken Caesar Salad (Flexible Dieting Lifestyle)
-- ============================================================
(13, 1.5, null, 'lbs', 'chicken breast', null, 1),
(13, 2, null, null, 'heads romaine lettuce', 'chopped', 2),
(13, 0.5, '1/2', 'cup', 'shredded Parmesan cheese', null, 3),
(13, 1, null, 'cup', 'croutons', null, 4),
(13, null, null, null, 'Caesar dressing', 'store-bought or homemade', 5),

-- ============================================================
-- RECIPE 14: Meal Prep Taco Salad (Kay Nutrition)
-- ============================================================
(14, 1, null, 'lb', 'ground beef', 'or turkey', 1),
(14, 1, null, null, 'onion', 'small, diced', 2),
(14, 1, null, 'tsp', 'chili powder', null, 3),
(14, 1, null, 'tsp', 'cumin', null, 4),
(14, 0.5, '1/2', 'tsp', 'garlic powder', null, 5),
(14, 4, null, 'cups', 'romaine lettuce', 'chopped', 6),
(14, 1, null, 'cup', 'cherry tomatoes', 'halved', 7),
(14, 1, null, 'cup', 'corn', 'canned or frozen', 8),
(14, 1, null, 'can (15oz)', 'black beans', 'drained', 9),
(14, 0.5, '1/2', 'cup', 'cheddar cheese', 'shredded', 10),
(14, 2, null, null, 'avocados', 'for dressing', 11),
(14, 1, null, 'bunch', 'cilantro', 'for dressing', 12),
(14, 1, null, null, 'lime', 'for dressing', 13),

-- ============================================================
-- RECIPE 15: Mediterranean Tuna Pasta Salad (Kay Nutrition)
-- ============================================================
(15, 2, null, 'cups', 'penne pasta', 'uncooked', 1),
(15, 2, null, 'cans (5oz)', 'tuna in water', 'drained', 2),
(15, 1, null, 'cup', 'cherry tomatoes', 'halved', 3),
(15, 1, null, null, 'English cucumber', 'diced', 4),
(15, 0.5, '1/2', null, 'red bell pepper', 'diced', 5),
(15, 0.25, '1/4', 'cup', 'red onion', 'finely diced', 6),
(15, 0.33, '1/3', 'cup', 'Kalamata olives', 'halved', 7),
(15, 0.25, '1/4', 'cup', 'fresh parsley', 'chopped', 8),
(15, 0.5, '1/2', 'cup', 'feta cheese', 'crumbled', 9),
(15, 3, null, 'tbsp', 'olive oil', null, 10),
(15, 2, null, 'tbsp', 'red wine vinegar', null, 11),
(15, 1, null, 'tbsp', 'lemon juice', null, 12),
(15, 1, null, 'clove', 'garlic', 'minced', 13),

-- ============================================================
-- RECIPE 16: Chicken Shawarma Salad (Kay Nutrition)
-- ============================================================
(16, 1.5, null, 'lbs', 'chicken breasts or thighs', null, 1),
(16, 1, null, 'tsp', 'cumin', null, 2),
(16, 1, null, 'tsp', 'paprika', null, 3),
(16, 0.5, '1/2', 'tsp', 'turmeric', null, 4),
(16, 0.5, '1/2', 'tsp', 'coriander', null, 5),
(16, 0.25, '1/4', 'tsp', 'cinnamon', null, 6),
(16, 3, null, 'cloves', 'garlic', 'minced', 7),
(16, 2, null, 'tbsp', 'lemon juice', null, 8),
(16, 2, null, 'tbsp', 'olive oil', null, 9),
(16, 4, null, 'cups', 'romaine lettuce', 'chopped', 10),
(16, 2, null, null, 'tomatoes', 'diced', 11),
(16, 1, null, null, 'cucumber', 'diced', 12),
(16, 0.25, '1/4', null, 'red onion', 'thinly sliced', 13),
(16, 3, null, 'tbsp', 'tahini', 'for dressing', 14),
(16, 2, null, 'tbsp', 'lemon juice', 'for dressing', 15),

-- ============================================================
-- RECIPE 17: Ground Taco Meat with Cauliflower Rice (Clean & Delicious)
-- ============================================================
(17, 1, null, 'lb', 'ground beef', null, 1),
(17, 1, null, 'packet', 'taco seasoning', null, 2),
(17, 0.25, '1/4', 'cup', 'water', null, 3),
(17, 4, null, 'cups', 'riced cauliflower', 'fresh or frozen', 4),
(17, 1, null, 'tbsp', 'olive oil', null, 5),

-- ============================================================
-- RECIPE 18: Cauliflower Chicken Fried Rice (Flexible Dieting Lifestyle)
-- ============================================================
(18, 1.5, null, 'lbs', 'chicken breast', 'diced', 1),
(18, 4, null, 'cups', 'riced cauliflower', null, 2),
(18, 3, null, null, 'eggs', 'large', 3),
(18, 1, null, 'cup', 'frozen peas and carrots', null, 4),
(18, 3, null, null, 'green onions', 'sliced', 5),
(18, 3, null, 'tbsp', 'low-sodium soy sauce', null, 6),
(18, 1, null, 'tbsp', 'sesame oil', null, 7),
(18, 1, null, 'tsp', 'garlic powder', null, 8),
(18, 1, null, 'tsp', 'ginger powder', null, 9),

-- ============================================================
-- RECIPE 19: XL Grinder Salad Wraps (Flexible Dieting Lifestyle)
-- ============================================================
(19, 1, null, 'lb', 'deli chicken', 'or turkey, sliced', 1),
(19, 4, null, null, 'large flour tortillas', null, 2),
(19, 2, null, 'cups', 'shredded iceberg lettuce', null, 3),
(19, 1, null, 'cup', 'cherry tomatoes', 'halved', 4),
(19, 0.5, '1/2', null, 'red onion', 'thinly sliced', 5),
(19, 4, null, 'slices', 'provolone cheese', null, 6),
(19, 4, null, null, 'pepperoncini', 'sliced', 7),
(19, 0.25, '1/4', 'cup', 'mayonnaise', null, 8),
(19, 2, null, 'tbsp', 'red wine vinegar', null, 9),
(19, 1, null, 'tsp', 'dried oregano', null, 10),

-- ============================================================
-- RECIPE 20: Chicken Tenders & Fries (Flexible Dieting Lifestyle)
-- ============================================================
(20, 1.5, null, 'lbs', 'chicken tenders', null, 1),
(20, 0.5, '1/2', 'cup', 'all-purpose flour', null, 2),
(20, 2, null, null, 'eggs', 'beaten', 3),
(20, 1, null, 'cup', 'panko breadcrumbs', null, 4),
(20, 0.5, '1/2', 'tsp', 'garlic powder', null, 5),
(20, 0.5, '1/2', 'tsp', 'paprika', null, 6),
(20, 4, null, null, 'medium potatoes', 'cut into fries', 7),

-- ============================================================
-- RECIPE 21: Slow Cooker Beef Barbacoa (Taste of Home)
-- ============================================================
(21, 3, null, 'lbs', 'beef chuck roast', null, 1),
(21, 3, null, null, 'chipotle peppers in adobo sauce', 'minced', 2),
(21, 4, null, 'cloves', 'garlic', 'minced', 3),
(21, 2, null, 'tbsp', 'lime juice', null, 4),
(21, 1, null, 'tbsp', 'apple cider vinegar', null, 5),
(21, 1, null, 'tsp', 'cumin', null, 6),
(21, 1, null, 'tsp', 'dried oregano', null, 7),
(21, 0.5, '1/2', 'tsp', 'ground cloves', null, 8),
(21, 0.5, '1/2', 'cup', 'chicken broth', null, 9),

-- ============================================================
-- RECIPE 22: Chickpea and Chorizo Taco Soup (SISU Fitness)
-- ============================================================
(22, 0.5, '1/2', 'lb', 'chorizo', 'casing removed', 1),
(22, 1, null, 'can (15oz)', 'chickpeas', 'drained', 2),
(22, 1, null, 'can (15oz)', 'black beans', 'drained', 3),
(22, 1, null, 'can (14oz)', 'diced tomatoes with green chiles', null, 4),
(22, 1, null, 'can (15oz)', 'corn', 'drained', 5),
(22, 1, null, null, 'onion', 'small, diced', 6),
(22, 3, null, 'cloves', 'garlic', 'minced', 7),
(22, 2, null, 'cups', 'chicken broth', null, 8),
(22, 1, null, 'tsp', 'cumin', null, 9),
(22, 1, null, 'tsp', 'chili powder', null, 10),

-- ============================================================
-- RECIPE 23: Slow Cooker Southwest Sweet Potato Chili (SISU Fitness)
-- ============================================================
(23, 1.5, null, 'lbs', 'boneless chicken breasts', null, 1),
(23, 2, null, null, 'medium sweet potatoes', 'peeled and diced', 2),
(23, 1, null, 'can (15oz)', 'black beans', 'drained', 3),
(23, 1, null, 'can (14oz)', 'diced tomatoes with green chiles', null, 4),
(23, 1, null, 'can (15oz)', 'corn', 'drained', 5),
(23, 1, null, 'cup', 'chicken broth', null, 6),
(23, 1, null, 'packet', 'taco seasoning', null, 7),
(23, 1, null, 'tsp', 'cumin', null, 8),

-- ============================================================
-- RECIPE 24: Creamy Taco Soup (SISU Fitness)
-- ============================================================
(24, 1, null, 'lb', 'ground beef', 'or turkey', 1),
(24, 1, null, null, 'onion', 'small, diced', 2),
(24, 1, null, 'can (14oz)', 'diced tomatoes with green chiles', null, 3),
(24, 1, null, 'can (15oz)', 'black beans', 'drained', 4),
(24, 1, null, 'can (15oz)', 'corn', 'drained', 5),
(24, 2, null, 'cups', 'beef or chicken broth', null, 6),
(24, 1, null, 'packet', 'taco seasoning', null, 7),
(24, 4, null, 'oz', 'cream cheese', 'softened', 8),

-- ============================================================
-- RECIPE 25: Slow Cooker Chicken Fajitas (SISU Fitness)
-- ============================================================
(25, 1.5, null, 'lbs', 'boneless skinless chicken breasts', null, 1),
(25, 3, null, null, 'bell peppers', 'red, yellow, green, sliced', 2),
(25, 1, null, null, 'large onion', 'sliced', 3),
(25, 1, null, 'can (14oz)', 'fire-roasted diced tomatoes', null, 4),
(25, 2, null, 'tbsp', 'taco seasoning', null, 5),
(25, 2, null, 'cloves', 'garlic', 'minced', 6),
(25, 1, null, null, 'lime', 'juiced', 7),

-- ============================================================
-- RECIPE 26: Copycat KFC Famous Bowls (SISU Fitness)
-- ============================================================
(26, 1.5, null, 'lbs', 'chicken tenders or strips', null, 1),
(26, 4, null, 'cups', 'mashed potatoes', 'homemade or instant', 2),
(26, 1, null, 'cup', 'corn', 'canned, drained', 3),
(26, 1, null, 'cup', 'brown gravy', null, 4),
(26, 1, null, 'cup', 'shredded cheddar cheese', null, 5),
(26, 0.5, '1/2', 'cup', 'flour', 'for breading', 6),
(26, 2, null, null, 'eggs', 'beaten, for breading', 7),
(26, 1, null, 'cup', 'panko breadcrumbs', null, 8),

-- ============================================================
-- RECIPE 27: Tex-Mex Roasted Veggie Quesadillas (SISU Fitness)
-- ============================================================
(27, 2, null, null, 'bell peppers', 'sliced', 1),
(27, 1, null, null, 'zucchini', 'sliced', 2),
(27, 1, null, null, 'red onion', 'sliced', 3),
(27, 1, null, 'cup', 'black beans', 'drained', 4),
(27, 1, null, 'tsp', 'cumin', null, 5),
(27, 1, null, 'tsp', 'chili powder', null, 6),
(27, 0.5, '1/2', 'tsp', 'garlic powder', null, 7),
(27, 8, null, null, 'flour tortillas', null, 8),
(27, 2, null, 'cups', 'shredded Monterey Jack cheese', 'or Mexican blend', 9),

-- ============================================================
-- RECIPE 28: Copycat Bacon Cheeseburger Hamburger Helper (SISU Fitness)
-- ============================================================
(28, 1, null, 'lb', 'ground beef', null, 1),
(28, 6, null, 'strips', 'bacon', 'cooked and crumbled', 2),
(28, 1.5, null, 'cups', 'elbow macaroni', 'uncooked', 3),
(28, 1.5, null, 'cups', 'beef broth', null, 4),
(28, 1, null, 'cup', 'milk', null, 5),
(28, 1, null, 'cup', 'shredded cheddar cheese', null, 6),
(28, 2, null, 'tbsp', 'ketchup', null, 7),
(28, 1, null, 'tbsp', 'Worcestershire sauce', null, 8),
(28, 1, null, 'tsp', 'garlic powder', null, 9),
(28, 1, null, 'tsp', 'onion powder', null, 10),

-- ============================================================
-- RECIPE 29: Taco Salad with Pan Fried Tortilla Strips (SISU Fitness)
-- ============================================================
(29, 1, null, 'lb', 'ground beef or turkey', null, 1),
(29, 1, null, 'packet', 'taco seasoning', null, 2),
(29, 4, null, 'cups', 'romaine lettuce', 'chopped', 3),
(29, 1, null, 'cup', 'cherry tomatoes', null, 4),
(29, 1, null, 'cup', 'corn', 'canned', 5),
(29, 1, null, 'can (15oz)', 'black beans', 'drained', 6),
(29, 0.5, '1/2', 'cup', 'shredded cheddar cheese', null, 7),
(29, 4, null, null, 'corn tortillas', 'cut into strips', 8),

-- ============================================================
-- RECIPE 30: Honey Sriracha Shrimp Fried Cauliflower Rice (SISU Fitness)
-- ============================================================
(30, 1, null, 'lb', 'large shrimp', 'peeled and deveined', 1),
(30, 4, null, 'cups', 'riced cauliflower', null, 2),
(30, 2, null, null, 'eggs', 'large', 3),
(30, 1, null, 'cup', 'frozen peas and carrots', null, 4),
(30, 3, null, 'tbsp', 'low-sodium soy sauce', null, 5),
(30, 2, null, 'tbsp', 'honey', null, 6),
(30, 1, null, 'tbsp', 'sriracha', null, 7),
(30, 1, null, 'tsp', 'sesame oil', null, 8),
(30, 3, null, null, 'green onions', 'sliced', 9),
(30, 2, null, 'cloves', 'garlic', 'minced', 10),
(30, 1, null, 'tbsp', 'olive oil', null, 11),

-- ============================================================
-- RECIPE 31: Microwavable BBQ Chicken Pasta Bake (SISU Fitness)
-- ============================================================
(31, 2, null, 'cups', 'cooked chicken', 'shredded or diced', 1),
(31, 2, null, 'cups', 'cooked pasta', 'rotini or penne', 2),
(31, 1, null, 'cup', 'BBQ sauce', null, 3),
(31, 0.5, '1/2', 'cup', 'chicken broth', null, 4),
(31, 0.5, '1/2', 'cup', 'shredded cheddar cheese', 'or Monterey Jack', 5),
(31, 0.25, '1/4', 'cup', 'red onion', 'diced', 6),

-- ============================================================
-- RECIPE 32: Pan Roasted Corn & Black Bean Burrito Bowls (SISU Fitness)
-- ============================================================
(32, 2, null, 'cups', 'corn', 'frozen or canned, drained', 1),
(32, 1, null, 'can (15oz)', 'black beans', 'drained and rinsed', 2),
(32, 2, null, 'cups', 'cooked brown rice', null, 3),
(32, 1, null, null, 'red bell pepper', 'diced', 4),
(32, 0.25, '1/4', null, 'red onion', 'diced', 5),
(32, 1, null, 'tsp', 'cumin', null, 6),
(32, 1, null, 'tsp', 'chili powder', null, 7),
(32, 0.5, '1/2', 'tsp', 'smoked paprika', null, 8),
(32, 1, null, 'tbsp', 'olive oil', null, 9),

-- ============================================================
-- RECIPE 48: Korean Beef Meal Prep Bowls (Kay Nutrition)
-- ============================================================
(48, 1.5, null, 'lbs', 'flank steak or beef strips', null, 1),
(48, 3, null, 'tbsp', 'low-sodium soy sauce', null, 2),
(48, 2, null, 'tbsp', 'rice vinegar', null, 3),
(48, 1, null, 'tbsp', 'brown sugar', null, 4),
(48, 1, null, 'tsp', 'sesame oil', null, 5),
(48, 3, null, 'cloves', 'garlic', 'minced', 6),
(48, 1, null, 'tsp', 'fresh ginger', 'minced', 7),
(48, 1, null, 'tsp', 'cornstarch', null, 8),
(48, 2, null, 'cups', 'cooked white or brown rice', null, 9),
(48, 2, null, 'cups', 'broccoli florets', 'steamed', 10),
(48, 2, null, null, 'carrots', 'julienned or sliced', 11),
(48, 3, null, null, 'green onions', 'sliced', 12),
(48, 1, null, 'tbsp', 'sesame seeds', null, 13),

-- ============================================================
-- RECIPE 49: Turkey Taco Skillet (Kay Nutrition)
-- ============================================================
(49, 1, null, 'lb', 'ground turkey', null, 1),
(49, 1, null, 'can (15oz)', 'black beans', 'drained', 2),
(49, 1, null, 'cup', 'corn', 'canned or frozen', 3),
(49, 1, null, 'can (14oz)', 'diced tomatoes', null, 4),
(49, 1, null, null, 'onion', 'small, diced', 5),
(49, 1, null, null, 'red bell pepper', 'diced', 6),
(49, 2, null, 'cloves', 'garlic', 'minced', 7),
(49, 2, null, 'tbsp', 'taco seasoning', null, 8),
(49, 0.5, '1/2', 'cup', 'chicken broth', null, 9),
(49, 1, null, 'cup', 'shredded Mexican cheese blend', null, 10),

-- ============================================================
-- RECIPE 50: Firecracker Beef Meal Prep Bowls (Kay Nutrition)
-- ============================================================
(50, 1.5, null, 'lbs', 'ground beef', null, 1),
(50, 2, null, 'tbsp', 'sriracha', null, 2),
(50, 2, null, 'tbsp', 'soy sauce', null, 3),
(50, 1, null, 'tbsp', 'rice vinegar', null, 4),
(50, 1, null, 'tbsp', 'honey', null, 5),
(50, 1, null, 'tsp', 'garlic powder', null, 6),
(50, 1, null, 'tsp', 'ginger powder', null, 7),
(50, 2, null, 'cups', 'broccoli florets', null, 8),
(50, 2, null, 'cups', 'carrots', 'sliced', 9),
(50, 2, null, 'cups', 'cooked white rice', null, 10),
(50, 2, null, null, 'green onions', 'sliced', 11),

-- ============================================================
-- RECIPE 51: Chicken Broccoli Rice Casserole (Kay Nutrition)
-- ============================================================
(51, 1.5, null, 'lbs', 'chicken breast', 'cubed', 1),
(51, 3, null, 'cups', 'broccoli florets', null, 2),
(51, 2, null, 'cups', 'cooked white or brown rice', null, 3),
(51, 1, null, 'can (10.5oz)', 'cream of chicken soup', null, 4),
(51, 0.5, '1/2', 'cup', 'chicken broth', null, 5),
(51, 1, null, 'cup', 'shredded cheddar cheese', null, 6),
(51, 0.5, '1/2', 'tsp', 'garlic powder', null, 7),
(51, 0.5, '1/2', 'tsp', 'onion powder', null, 8),

-- ============================================================
-- RECIPE 52: Greek Turkey Meatballs (Kay Nutrition)
-- ============================================================
(52, 1, null, 'lb', 'ground turkey', null, 1),
(52, 0.33, '1/3', 'cup', 'breadcrumbs', null, 2),
(52, 1, null, null, 'egg', 'large', 3),
(52, 2, null, 'cloves', 'garlic', 'minced', 4),
(52, 2, null, 'tbsp', 'fresh parsley', 'chopped', 5),
(52, 1, null, 'tbsp', 'fresh mint', 'chopped', 6),
(52, 1, null, 'tsp', 'dried dill', null, 7),
(52, 0.5, '1/2', 'tsp', 'dried oregano', null, 8),
(52, 1, null, null, 'lemon', 'zested', 9),
(52, 1, null, 'cup', 'orzo', 'cooked', 10),
(52, null, null, null, 'tzatziki', 'for serving', 11),

-- ============================================================
-- RECIPE 53: Greek Chicken Casserole (Kay Nutrition)
-- ============================================================
(53, 1.5, null, 'lbs', 'chicken thighs or breasts', null, 1),
(53, 1, null, 'cup', 'cherry tomatoes', 'halved', 2),
(53, 0.5, '1/2', 'cup', 'Kalamata olives', 'pitted', 3),
(53, 1, null, 'cup', 'artichoke hearts', 'canned, drained', 4),
(53, 1, null, null, 'red onion', 'sliced', 5),
(53, 4, null, 'cloves', 'garlic', 'minced', 6),
(53, 2, null, 'tbsp', 'olive oil', null, 7),
(53, 1, null, 'tsp', 'dried oregano', null, 8),
(53, 1, null, 'tsp', 'dried thyme', null, 9),
(53, 0.5, '1/2', 'cup', 'feta cheese', 'crumbled', 10),

-- ============================================================
-- RECIPE 54: Sheet Pan Chicken and Broccoli (Kay Nutrition)
-- ============================================================
(54, 1.5, null, 'lbs', 'chicken breast', 'cut into chunks', 1),
(54, 4, null, 'cups', 'broccoli florets', null, 2),
(54, 3, null, 'tbsp', 'soy sauce', null, 3),
(54, 2, null, 'tbsp', 'olive oil', null, 4),
(54, 1, null, 'tbsp', 'sesame oil', null, 5),
(54, 1, null, 'tbsp', 'honey', null, 6),
(54, 3, null, 'cloves', 'garlic', 'minced', 7),
(54, 0.5, '1/2', 'tsp', 'ginger powder', null, 8),
(54, 1, null, 'tbsp', 'sesame seeds', null, 9),

-- ============================================================
-- RECIPE 55: Spaghetti Squash Casserole (Kay Nutrition)
-- ============================================================
(55, 1, null, null, 'medium spaghetti squash', 'about 3 lbs', 1),
(55, 1, null, 'lb', 'ground beef or turkey', null, 2),
(55, 1, null, 'jar (24oz)', 'marinara sauce', null, 3),
(55, 1, null, 'cup', 'ricotta cheese', null, 4),
(55, 1, null, 'cup', 'shredded mozzarella', null, 5),
(55, 0.25, '1/4', 'cup', 'Parmesan', 'grated', 6),
(55, 2, null, 'cloves', 'garlic', 'minced', 7),
(55, 1, null, 'tsp', 'Italian seasoning', null, 8),

-- ============================================================
-- RECIPE 56: Spinach Artichoke Chicken Casserole (Kay Nutrition)
-- ============================================================
(56, 1.5, null, 'lbs', 'chicken breast', 'cubed', 1),
(56, 3, null, 'cups', 'fresh spinach', 'or 10oz frozen, thawed', 2),
(56, 1, null, 'can (14oz)', 'artichoke hearts', 'drained and chopped', 3),
(56, 4, null, 'oz', 'cream cheese', 'softened', 4),
(56, 0.5, '1/2', 'cup', 'sour cream or Greek yogurt', null, 5),
(56, 0.5, '1/2', 'cup', 'mayonnaise', null, 6),
(56, 1, null, 'cup', 'shredded mozzarella', null, 7),
(56, 0.5, '1/2', 'cup', 'Parmesan', 'grated', 8),
(56, 3, null, 'cloves', 'garlic', 'minced', 9),

-- ============================================================
-- RECIPE 57: Shredded Beef Tacos (Kay Nutrition)
-- ============================================================
(57, 2.5, null, 'lbs', 'beef chuck roast', null, 1),
(57, 1, null, 'can (14oz)', 'diced tomatoes with green chiles', null, 2),
(57, 1, null, null, 'onion', 'small, diced', 3),
(57, 4, null, 'cloves', 'garlic', 'minced', 4),
(57, 2, null, 'tbsp', 'taco seasoning', null, 5),
(57, 1, null, 'tsp', 'cumin', null, 6),
(57, 0.5, '1/2', 'cup', 'beef broth', null, 7),

-- ============================================================
-- RECIPE 58: Beef Shawarma (Kay Nutrition)
-- ============================================================
(58, 1.5, null, 'lbs', 'beef sirloin or flank steak', 'sliced thin', 1),
(58, 1, null, 'tsp', 'cumin', null, 2),
(58, 1, null, 'tsp', 'coriander', null, 3),
(58, 1, null, 'tsp', 'paprika', null, 4),
(58, 0.5, '1/2', 'tsp', 'turmeric', null, 5),
(58, 0.25, '1/4', 'tsp', 'cinnamon', null, 6),
(58, 3, null, 'cloves', 'garlic', 'minced', 7),
(58, 2, null, 'tbsp', 'olive oil', null, 8),
(58, 2, null, 'tbsp', 'lemon juice', null, 9),
(58, null, null, null, 'pita bread', 'for serving', 10),
(58, null, null, null, 'hummus', 'for serving', 11),

-- ============================================================
-- RECIPE 59: Ground Turkey Meal Prep Bowls (Kay Nutrition)
-- ============================================================
(59, 1, null, 'lb', 'ground turkey', null, 1),
(59, 1, null, null, 'onion', 'small, diced', 2),
(59, 2, null, 'cloves', 'garlic', 'minced', 3),
(59, 1, null, 'cup', 'cherry tomatoes', 'halved', 4),
(59, 2, null, 'cups', 'zucchini', 'diced', 5),
(59, 1, null, 'tsp', 'Italian seasoning', null, 6),
(59, 1, null, 'tsp', 'paprika', null, 7),
(59, 2, null, 'cups', 'cooked rice or quinoa', null, 8),
(59, 1, null, 'tbsp', 'olive oil', null, 9),

-- ============================================================
-- RECIPE 60: Stuffed Pepper Casserole (Kay Nutrition)
-- ============================================================
(60, 1, null, 'lb', 'ground beef or turkey', null, 1),
(60, 3, null, null, 'bell peppers', 'any colors, diced', 2),
(60, 1, null, null, 'onion', 'small, diced', 3),
(60, 3, null, 'cloves', 'garlic', 'minced', 4),
(60, 1, null, 'can (14oz)', 'diced tomatoes', null, 5),
(60, 1, null, 'cup', 'tomato sauce', null, 6),
(60, 1, null, 'cup', 'cooked rice', null, 7),
(60, 1, null, 'tsp', 'Italian seasoning', null, 8),
(60, 1, null, 'tsp', 'paprika', null, 9),
(60, 1, null, 'cup', 'shredded mozzarella', null, 10),

-- ============================================================
-- RECIPE 61: Beef and Mushroom Stew (Kay Nutrition)
-- ============================================================
(61, 2, null, 'lbs', 'beef stew meat', 'cubed', 1),
(61, 3, null, 'cups', 'mushrooms', 'quartered', 2),
(61, 3, null, null, 'carrots', 'sliced', 3),
(61, 3, null, null, 'potatoes', 'cubed', 4),
(61, 1, null, null, 'onion', 'diced', 5),
(61, 4, null, 'cloves', 'garlic', 'minced', 6),
(61, 2, null, 'cups', 'beef broth', null, 7),
(61, 1, null, 'cup', 'red wine', 'or additional broth', 8),
(61, 2, null, 'tbsp', 'tomato paste', null, 9),
(61, 1, null, 'tsp', 'dried thyme', null, 10),
(61, 1, null, 'tsp', 'dried rosemary', null, 11),
(61, 2, null, 'tbsp', 'flour', null, 12),
(61, 2, null, 'tbsp', 'olive oil', null, 13),

-- ============================================================
-- RECIPE 62: Sheet Pan Steak Fajitas (Kay Nutrition)
-- ============================================================
(62, 1.5, null, 'lbs', 'flank or skirt steak', 'sliced thin', 1),
(62, 3, null, null, 'bell peppers', 'red, green, yellow, sliced', 2),
(62, 1, null, null, 'large onion', 'sliced', 3),
(62, 2, null, 'tbsp', 'olive oil', null, 4),
(62, 1, null, 'tbsp', 'chili powder', null, 5),
(62, 1, null, 'tsp', 'cumin', null, 6),
(62, 1, null, 'tsp', 'garlic powder', null, 7),
(62, 0.5, '1/2', 'tsp', 'smoked paprika', null, 8),

-- ============================================================
-- RECIPE 63: Sheet Pan Bruschetta Chicken (Kay Nutrition)
-- ============================================================
(63, 1.5, null, 'lbs', 'chicken breasts', '4 medium', 1),
(63, 2, null, 'cups', 'cherry tomatoes', 'halved', 2),
(63, 4, null, 'cloves', 'garlic', 'minced', 3),
(63, 0.25, '1/4', 'cup', 'fresh basil', 'chopped', 4),
(63, 3, null, 'tbsp', 'olive oil', null, 5),
(63, 2, null, 'tbsp', 'balsamic vinegar', null, 6),
(63, 1, null, 'cup', 'shredded mozzarella', null, 7),

-- ============================================================
-- RECIPE 64: Chicken Burrito Casserole (Kay Nutrition)
-- ============================================================
(64, 1.5, null, 'lbs', 'chicken breast', 'cooked and shredded', 1),
(64, 1, null, 'can (15oz)', 'black beans', 'drained', 2),
(64, 1, null, 'cup', 'corn', 'canned or frozen', 3),
(64, 1, null, 'cup', 'salsa', null, 4),
(64, 1, null, 'cup', 'sour cream or Greek yogurt', null, 5),
(64, 2, null, 'cups', 'cooked rice', null, 6),
(64, 8, null, null, 'small flour tortillas', 'cut into strips', 7),
(64, 2, null, 'cups', 'shredded Mexican cheese blend', null, 8),
(64, 1, null, 'tsp', 'cumin', null, 9),
(64, 1, null, 'tsp', 'chili powder', null, 10),

-- ============================================================
-- RECIPE 65: Meal Prep Instant Noodle Cups (Kay Nutrition)
-- ============================================================
(65, 2, null, 'packages', 'rice noodles or ramen noodles', null, 1),
(65, 2, null, 'cups', 'cooked chicken', 'shredded or diced', 2),
(65, 2, null, 'tbsp', 'low-sodium soy sauce', null, 3),
(65, 1, null, 'tbsp', 'rice vinegar', null, 4),
(65, 1, null, 'tsp', 'sesame oil', null, 5),
(65, 1, null, 'tsp', 'ginger powder', null, 6),
(65, 1, null, 'cup', 'shredded carrots', null, 7),
(65, 1, null, 'cup', 'baby spinach or bok choy', null, 8),
(65, 3, null, null, 'green onions', 'sliced', 9),

-- ============================================================
-- RECIPE 66: Air Fryer Broccoli (Eating Bird Food)
-- ============================================================
(66, 4, null, 'cups', 'broccoli florets', null, 1),
(66, 2, null, 'tbsp', 'olive oil', null, 2),
(66, 0.5, '1/2', 'tsp', 'garlic powder', null, 3),

-- ============================================================
-- RECIPE 67: Honey Mustard Brussels Sprouts (SISU Fitness)
-- ============================================================
(67, 1, null, 'lb', 'Brussels sprouts', 'trimmed and halved', 1),
(67, 2, null, 'tbsp', 'olive oil', null, 2),
(67, 2, null, 'tbsp', 'Dijon mustard', null, 3),
(67, 1, null, 'tbsp', 'honey', null, 4),
(67, 1, null, 'tbsp', 'apple cider vinegar', null, 5),
(67, 2, null, 'cloves', 'garlic', 'minced', 6);
