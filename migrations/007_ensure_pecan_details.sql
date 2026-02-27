-- Migration 007: Ensure pecan clusters details exist

INSERT INTO recipe_details (recipe_id, ingredients, steps)
VALUES (
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
)
ON CONFLICT (recipe_id) DO UPDATE SET
  ingredients = EXCLUDED.ingredients,
  steps = EXCLUDED.steps;
