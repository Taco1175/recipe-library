-- Migration 006: Clean up Pecan Clusters collision debris

-- Remove from extra_recipes since it's now in the BASE array
DELETE FROM extra_recipes WHERE id = 76;

-- Also clean up any bad recipe_details that got saved with wrong data during collision
DELETE FROM recipe_details WHERE recipe_id = 71 AND ingredients @> ARRAY['2 cups pecans'];

-- Re-insert clean details for ID 76 (in case 005 had a conflict)
DELETE FROM recipe_details WHERE recipe_id = 76;
DELETE FROM recipe_ingredients WHERE recipe_id = 76;

INSERT INTO recipe_details (recipe_id, ingredients, steps) VALUES (
  76,
  ARRAY[
    '2 cups pecans',
    '20 oz chocolate almond bark',
    '20 oz white chocolate almond bark',
    '1 cup dark chocolate melting wafers',
    '1 (11 oz) bag caramel bits',
    'Sea salt for garnish'
  ],
  ARRAY[
    'Add the pecans to the bottom of the slow cooker.',
    'Break the chocolate almond bark and white chocolate almond bark into smaller pieces and place over the pecans.',
    'Sprinkle the dark chocolate melting wafers evenly over the top.',
    'Cover and cook on LOW for approximately 1 hour, stirring occasionally, until fully melted.',
    'Add caramel bits and gently stir to combine everything.',
    'Drop spoonfuls onto a parchment-lined baking sheet. Sprinkle with sea salt and top with a pecan.',
    'Let cool at room temperature or refrigerate to set faster.'
  ]
);

INSERT INTO recipe_ingredients (recipe_id, amount, amount_fraction, measurement, ingredient, notes, sort_order) VALUES
(76, 2.0, NULL, 'cup', 'pecans', NULL, 1),
(76, 20.0, NULL, 'oz', 'chocolate almond bark', NULL, 2),
(76, 20.0, NULL, 'oz', 'white chocolate almond bark', NULL, 3),
(76, 1.0, NULL, 'cup', 'dark chocolate melting wafers', 'like Ghirardelli', 4),
(76, 11.0, NULL, 'oz', 'caramel bits', '1 bag', 5),
(76, NULL, NULL, NULL, 'sea salt', 'for garnish', 6);
