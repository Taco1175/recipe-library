-- Recipe Details - All recipes EXCEPT Hungry Hobby (IDs 33-47)
-- Run this in Supabase SQL Editor
-- This UPSERTS so it's safe to re-run

INSERT INTO recipe_details (recipe_id, url, ingredients, steps)
VALUES

-- ============ BREAKFAST (IDs 7-12) ============

-- 7. Spinach Breakfast Casserole (Kay Nutrition)
(7, 'https://kaynutrition.com/spinach-breakfast-casserole/',
ARRAY['12 large eggs','1 lb baby potatoes, diced','3 cups fresh spinach','1 leek, white and light green parts, diced','1 cup sharp cheddar cheese, shredded','1 tbsp butter','1 tbsp olive oil','Salt and pepper to taste'],
ARRAY['Preheat oven to 400°F. Boil baby potatoes until just tender, about 8-10 minutes, then drain and add to a greased 9x13 baking dish.','In a pan, warm butter and olive oil over medium heat. Add diced leek and sauté 3-4 minutes until tender. Add spinach and cook 1 more minute until wilted.','Spread leek and spinach mixture over potatoes. Sprinkle with shredded cheddar.','Whisk eggs with salt and pepper in a large bowl. Pour over the casserole.','Bake 25-30 minutes until eggs are fully set. Cool 5 minutes before slicing. Store in fridge up to 4 days.']),

-- 8. Breakfast Egg Bake (Kay Nutrition)
(8, 'https://kaynutrition.com/breakfast-egg-bake/',
ARRAY['10 large eggs','1 lb breakfast sausage (pork or turkey)','2 cups potatoes, diced small','1 red bell pepper, diced','1 green bell pepper, diced','1 small onion, diced','1 cup shredded cheddar cheese','Salt, pepper, and garlic powder to taste'],
ARRAY['Preheat oven to 375°F. Add diced potatoes to a greased casserole dish and roast for 20 minutes until just tender.','Meanwhile, brown sausage in a skillet over medium heat, breaking apart as it cooks. Drain fat.','Add peppers and onion to sausage and sauté 5 minutes until softened.','Add sausage and veggie mixture to the casserole dish on top of the potatoes.','Whisk eggs with salt, pepper, and garlic powder. Pour over everything. Sprinkle with cheese.','Bake 25-30 minutes until eggs are set and cheese is golden. Slice into 6 servings and refrigerate up to 5 days.']),

-- 9. Spinach Egg Muffins with Feta (Kay Nutrition)
(9, 'https://kaynutrition.com/spinach-egg-muffins-with-feta/',
ARRAY['8 large eggs','2 cups fresh spinach, roughly chopped','1/2 cup feta cheese, crumbled','Salt and pepper to taste'],
ARRAY['Preheat oven to 350°F. Grease a 12-cup muffin tin well (silicone works best).','In a large bowl, crack eggs and whisk together. Season with salt and pepper.','Add chopped spinach and whisk again to combine.','Divide egg mixture evenly among muffin cups, filling halfway. Sprinkle crumbled feta on top of each.','Bake 18-20 minutes until centres are fully set. Cool 5 minutes before removing. Store in fridge up to 5 days.']),

-- 10. Bacon Egg Muffin Cups (Kay Nutrition)
(10, 'https://kaynutrition.com/bacon-egg-muffin-cups/',
ARRAY['12 strips turkey or regular bacon','12 large eggs','1 cup sliced mushrooms','Salt and pepper to taste'],
ARRAY['Preheat oven to 400°F. Par-cook bacon on a baking sheet for 8-10 minutes — it should be partially cooked but still pliable.','Grease each cup of a 12-cup muffin tin with a little olive oil.','Line each muffin cup with a strip of bacon, wrapping it around the inside edge.','Divide mushrooms evenly among the cups and season with a pinch of salt and pepper.','Crack one egg into each cup. Bake 15-20 minutes until eggs are set to your liking. Cool slightly, remove with a spoon, and store in fridge up to 5 days.']),

-- 11. Greek Omelette Casserole (Kay Nutrition)
(11, 'https://kaynutrition.com/greek-omelette-casserole/',
ARRAY['8 large eggs','1/2 cup feta cheese, crumbled','1/2 cup Kalamata olives, sliced','1 cup cherry tomatoes, halved','1 small onion, diced','2 cups fresh spinach','1 tsp dried oregano','1 tbsp olive oil','Salt and pepper to taste'],
ARRAY['Preheat oven to 400°F. Grease a 9x9 inch baking dish.','Heat olive oil in a pan over medium heat. Add diced onion and cook 2-3 minutes. Add spinach and oregano and cook until wilted. Season with salt.','Transfer onion-spinach mixture to baking dish. Add chopped tomatoes and olives and spread evenly.','Whisk eggs in a bowl with salt and pepper. Pour over the vegetables. Top with crumbled feta.','Bake 20-25 minutes until eggs are set in the middle. Cool and slice. Keeps in fridge up to 5 days.']),

-- 12. Egg Muffins with Red Pepper & Spinach (Kay Nutrition)
(12, 'https://kaynutrition.com/egg-muffins-red-pepper-spinach/',
ARRAY['8 large eggs','1 red bell pepper, finely diced','1 cup fresh spinach, roughly chopped','1/2 cup shredded cheddar cheese','Salt and pepper to taste'],
ARRAY['Preheat oven to 350°F. Grease a 12-cup muffin tin well.','Whisk eggs together in a large bowl. Season with salt and pepper.','Add diced bell pepper and chopped spinach to the egg mixture and stir to combine.','Divide egg mixture evenly among muffin cups, filling halfway. Sprinkle cheese on top of each.','Bake 17-20 minutes until centers are set. Cool 5 minutes before removing. Store in fridge up to 5 days.']),

-- ============ SALADS (IDs 13-16) ============

-- 13. Big Chicken Caesar Salad (Flexible Dieting Lifestyle)
(13, 'https://flexibledietinglifestyle.com/big-chicken-caesar-salad/',
ARRAY['1.5 lbs chicken breast','2 heads romaine lettuce, chopped','1/2 cup shredded Parmesan cheese','1 cup croutons','Caesar dressing (store-bought or homemade)','Salt, pepper, and garlic powder to taste','Olive oil spray'],
ARRAY['Season chicken breasts with salt, pepper, and garlic powder. Spray with olive oil.','Cook in air fryer at 375°F for 18-20 minutes, flipping halfway, until internal temp reaches 165°F. (Or bake at 400°F for 25 minutes.)','Let chicken rest 5 minutes, then slice or chop.','In a large bowl, toss chopped romaine with Caesar dressing to coat.','Divide into bowls or containers. Top with sliced chicken, Parmesan, and croutons. Add dressing to go containers for meal prep.']),

-- 14. Meal Prep Taco Salad (Kay Nutrition)
(14, 'https://kaynutrition.com/meal-prep-taco-salad/',
ARRAY['1 lb ground beef (or turkey)','1 small onion, diced','1 tsp chili powder','1 tsp cumin','1/2 tsp garlic powder','1/2 tsp dried oregano','4 cups romaine lettuce, chopped','1 cup cherry tomatoes, halved','1 cup corn (canned or frozen)','1 can (15oz) black beans, drained','1/2 cup cheddar cheese, shredded','2 avocados, 1 bunch cilantro, 1 lime (for dressing)','Salt and pepper to taste'],
ARRAY['Cook ground beef and onion in a skillet over medium heat until browned. Drain fat. Add chili powder, cumin, garlic powder, and oregano. Season with salt and pepper. Cool completely.','Make the avocado cilantro dressing: blend avocados, cilantro, lime juice, a little water, salt, and pepper until smooth.','Divide romaine into 4 meal prep containers. Top each with equal amounts of taco meat, tomatoes, corn, black beans, and cheese.','Store dressing separately in small containers. When ready to eat, drizzle dressing and toss. Keeps up to 5 days in fridge.']),

-- 15. Mediterranean Tuna Pasta Salad (Kay Nutrition)
(15, 'https://kaynutrition.com/mediterranean-tuna-pasta-salad/',
ARRAY['2 cups penne pasta (uncooked)','2 cans (5oz each) tuna in water, drained','1 cup cherry tomatoes, halved','1 English cucumber, diced','1/2 red bell pepper, diced','1/4 cup red onion, finely diced','1/3 cup Kalamata olives, halved','1/4 cup fresh parsley, chopped','1/2 cup feta cheese, crumbled','3 tbsp olive oil','2 tbsp red wine vinegar','1 tbsp lemon juice','1 clove garlic, minced','Salt and pepper to taste'],
ARRAY['Cook pasta according to package directions to al dente. Drain, rinse with cold water, and let cool completely.','In a small bowl, whisk together olive oil, red wine vinegar, lemon juice, minced garlic, salt, and pepper to make the dressing.','In a large bowl, combine cooled pasta, tuna, tomatoes, cucumber, bell pepper, red onion, olives, and parsley.','Pour dressing over and toss well. Top with crumbled feta. Season to taste.','Serve immediately or refrigerate up to 3 days.']),

-- 16. Chicken Shawarma Salad (Kay Nutrition)
(16, 'https://kaynutrition.com/chicken-shawarma-salad/',
ARRAY['1.5 lbs chicken breasts or thighs','1 tsp cumin','1 tsp paprika','1/2 tsp turmeric','1/2 tsp coriander','1/4 tsp cinnamon','3 cloves garlic, minced','2 tbsp lemon juice','2 tbsp olive oil','Salt and pepper to taste','4 cups romaine lettuce, chopped','2 tomatoes, diced','1 cucumber, diced','1/4 red onion, thinly sliced','Fresh parsley','For garlic tahini dressing: 3 tbsp tahini, 2 tbsp lemon juice, 1 clove garlic, 2-3 tbsp water, salt'],
ARRAY['Combine cumin, paprika, turmeric, coriander, cinnamon, garlic, lemon juice, olive oil, salt, and pepper in a bowl. Add chicken and marinate at least 30 minutes (overnight is best).','Cook chicken in a skillet over medium-high heat or roast at 400°F for 25-30 minutes until cooked through. Rest 5 minutes, then slice thinly.','Make tahini dressing: whisk together tahini, lemon juice, garlic, water, and salt until smooth and drizzleable.','Toss romaine, tomatoes, cucumber, red onion, and parsley together in a large bowl.','Top salad with sliced chicken and drizzle with garlic tahini dressing.']),

-- ============ LUNCH/DINNER - Stovetop/Other (IDs 17-32) ============

-- 17. Ground Taco Meat with Cauliflower Rice (Clean & Delicious)
(17, 'https://cleananddelicious.com/taco-cauliflower-rice/',
ARRAY['1 lb ground beef','1 packet taco seasoning (or 2 tbsp homemade)','1/4 cup water','4 cups riced cauliflower (fresh or frozen)','1 tbsp olive oil','Salt, cumin, garlic powder to taste','Optional toppings: salsa, sour cream, cheese, avocado'],
ARRAY['Brown ground beef in a skillet over medium-high heat, breaking apart as it cooks. Drain fat.','Add taco seasoning and water. Stir and simmer 2-3 minutes until sauce thickens. Set aside.','In a separate large skillet, heat olive oil over medium-high heat. Add cauliflower rice and season with salt, cumin, and garlic powder.','Cook cauliflower rice, stirring often, for 5-7 minutes until tender.','Serve taco meat over cauliflower rice with your choice of toppings.']),

-- 18. Cauliflower Chicken Fried Rice (Flexible Dieting Lifestyle)
(18, 'https://flexibledietinglifestyle.com/cauliflower-chicken-fried-rice/',
ARRAY['1.5 lbs chicken breast, diced','4 cups riced cauliflower','3 large eggs','1 cup frozen peas and carrots','3 green onions, sliced','3 tbsp low-sodium soy sauce','1 tbsp sesame oil','1 tsp garlic powder','1 tsp ginger powder','1 tbsp olive oil or sesame oil for cooking','Salt and pepper to taste'],
ARRAY['Season diced chicken with salt, pepper, and garlic powder. Cook in a large skillet or wok over high heat with a little oil until cooked through. Set aside.','In the same pan, scramble the eggs until just set. Push to the side.','Add a little more oil. Add cauliflower rice, peas, and carrots. Cook 5-6 minutes, stirring often.','Add cooked chicken and eggs back to the pan. Add soy sauce, sesame oil, and ginger. Toss everything together.','Top with green onions and serve hot.']),

-- 19. XL Grinder Salad Wraps (Flexible Dieting Lifestyle)
(19, 'https://flexibledietinglifestyle.com/xl-grinder-salad-wraps/',
ARRAY['1 lb deli chicken (or turkey), sliced','4 large flour tortillas or flatbreads','2 cups shredded iceberg lettuce','1 cup cherry tomatoes, halved','1/2 red onion, thinly sliced','4 slices provolone cheese','4 pepperoncini, sliced','For dressing: 1/4 cup mayo, 2 tbsp red wine vinegar, 1 tsp dried oregano, salt, pepper, red pepper flakes'],
ARRAY['Mix dressing: whisk mayo, red wine vinegar, oregano, salt, pepper, and red pepper flakes together.','In a large bowl, toss shredded lettuce, tomatoes, red onion, and pepperoncini with the dressing.','Lay out tortillas. Layer deli chicken and provolone on each.','Top with a generous pile of the dressed salad.','Roll up tightly, slice in half, and serve immediately (or keep components separate for meal prep).']),

-- 20. Chicken Tenders & Fries (Flexible Dieting Lifestyle)
(20, 'https://flexibledietinglifestyle.com/chicken-tenders-and-fries/',
ARRAY['1.5 lbs chicken tenders','1/2 cup all-purpose flour','2 large eggs, beaten','1 cup panko breadcrumbs','1/2 tsp garlic powder','1/2 tsp paprika','Salt and pepper','4 medium potatoes, cut into fries','Olive oil spray'],
ARRAY['Preheat air fryer to 400°F. Season potatoes with salt, pepper, and a little oil. Air fry fries for 20-25 minutes, shaking halfway.','Set up a breading station: flour (seasoned with salt, pepper, garlic powder) → beaten eggs → panko mixed with paprika.','Bread chicken tenders: coat in flour, dip in egg, press into panko.','Air fry chicken tenders at 400°F for 12-15 minutes, flipping halfway, until golden and cooked through.','Serve tenders and fries together with dipping sauce of choice.']),

-- 21. Slow Cooker Beef Barbacoa (Taste of Home)
(21, 'https://www.tasteofhome.com/recipes/slow-cooker-beef-barbacoa/',
ARRAY['3 lbs beef chuck roast','3 chipotle peppers in adobo sauce, minced','4 cloves garlic, minced','2 tbsp lime juice','1 tbsp apple cider vinegar','1 tsp cumin','1 tsp dried oregano','1/2 tsp ground cloves','1/2 cup chicken broth','Salt and pepper to taste'],
ARRAY['Season beef chuck roast generously with salt and pepper. Place in slow cooker.','Mix together chipotle peppers, garlic, lime juice, apple cider vinegar, cumin, oregano, cloves, and chicken broth. Pour over beef.','Cook on LOW for 8-10 hours or HIGH for 5-6 hours until beef is very tender and shreds easily.','Remove beef and shred with two forks. Return to slow cooker and mix with the juices.','Serve in tacos, burritos, or over rice. Keeps in fridge up to 5 days or freeze up to 3 months.']),

-- 22. Chickpea and Chorizo Taco Soup (SISU Fitness)
(22, 'https://www.sisufitness.com/chickpea-chorizo-taco-soup/',
ARRAY['1/2 lb chorizo, casing removed','1 can (15oz) chickpeas, drained','1 can (15oz) black beans, drained','1 can (14oz) diced tomatoes with green chiles','1 can (15oz) corn, drained','1 small onion, diced','3 cloves garlic, minced','2 cups chicken broth','1 tsp cumin','1 tsp chili powder','Salt and pepper to taste','Optional toppings: sour cream, cheese, cilantro'],
ARRAY['In a large pot over medium-high heat, cook chorizo until browned, breaking apart. Drain excess fat.','Add onion and garlic and cook 2-3 minutes until softened.','Add chickpeas, black beans, diced tomatoes, corn, chicken broth, cumin, and chili powder. Stir to combine.','Bring to a boil, then reduce heat and simmer 20-25 minutes.','Season to taste and serve with desired toppings. Stores well in fridge 4-5 days.']),

-- 23. Slow Cooker Southwest Sweet Potato Chili (SISU Fitness)
(23, 'https://www.sisufitness.com/slow-cooker-southwest-sweet-potato-chili/',
ARRAY['1.5 lbs boneless chicken breasts','2 medium sweet potatoes, peeled and diced','1 can (15oz) black beans, drained','1 can (14oz) diced tomatoes with green chiles','1 can (15oz) corn, drained','1 cup chicken broth','1 packet taco seasoning (or 2 tbsp)','1 tsp cumin','1/2 tsp chili powder','Salt and pepper to taste'],
ARRAY['Add chicken breasts to the bottom of the slow cooker.','Add diced sweet potatoes, black beans, diced tomatoes, corn, and chicken broth on top.','Sprinkle taco seasoning, cumin, and chili powder over everything.','Cook on LOW for 6-8 hours or HIGH for 3-4 hours.','Remove chicken, shred with two forks, and return to pot. Stir everything together. Serve topped with sour cream, cheese, or avocado.']),

-- 24. Creamy Taco Soup (SISU Fitness)
(24, 'https://www.sisufitness.com/creamy-taco-soup/',
ARRAY['1 lb ground beef (or turkey)','1 small onion, diced','1 can (14oz) diced tomatoes with green chiles','1 can (15oz) black beans, drained','1 can (15oz) corn, drained','2 cups beef or chicken broth','1 packet taco seasoning','4 oz cream cheese, softened','Salt and pepper to taste','Optional toppings: avocado, shredded cheese, sour cream, cilantro'],
ARRAY['Brown ground beef and onion in a large pot over medium heat. Drain fat.','Add diced tomatoes, black beans, corn, broth, and taco seasoning. Stir to combine.','Bring to a boil, then reduce to a simmer for 15-20 minutes.','Reduce heat to low. Add cream cheese in chunks and stir until fully melted and smooth.','Taste and season. Ladle into bowls and top with desired toppings. Keeps up to 5 days in fridge.']),

-- 25. Slow Cooker Chicken Fajitas (SISU Fitness)
(25, 'https://www.sisufitness.com/slow-cooker-chicken-fajitas/',
ARRAY['1.5 lbs boneless skinless chicken breasts','3 bell peppers (red, yellow, green), sliced','1 large onion, sliced','1 can (14oz) fire-roasted diced tomatoes','2 tbsp taco seasoning (or 1 packet)','2 cloves garlic, minced','Juice of 1 lime','Flour or corn tortillas for serving','Optional: sour cream, cheese, guacamole'],
ARRAY['Add sliced bell peppers and onion to the bottom of the slow cooker.','Place chicken breasts on top of the vegetables.','Pour diced tomatoes over chicken. Sprinkle taco seasoning and garlic over everything. Squeeze lime juice on top.','Cook on LOW for 6-8 hours or HIGH for 3-4 hours.','Remove chicken, shred or slice, and return to pot. Stir with juices. Serve in warm tortillas with desired toppings.']),

-- 26. Copycat KFC Famous Bowls (SISU Fitness)
(26, 'https://www.sisufitness.com/copycat-kfc-famous-bowls/',
ARRAY['1.5 lbs chicken tenders or strips','4 cups mashed potatoes (homemade or instant)','1 cup corn (canned, drained)','1 cup brown gravy','1 cup shredded cheddar cheese','Flour, egg, panko breadcrumbs for breading','Salt, pepper, garlic powder, paprika'],
ARRAY['Bread chicken: season flour with salt, pepper, garlic powder. Dip chicken in flour, then beaten egg, then panko.','Bake chicken at 400°F for 18-22 minutes or cook in air fryer at 400°F for 12-15 minutes until golden and cooked through.','Warm mashed potatoes and prepare gravy according to package or recipe.','Assemble bowls: start with a generous scoop of mashed potatoes, add corn, top with chicken pieces.','Drizzle warm gravy over everything and sprinkle with shredded cheddar cheese.']),

-- 27. Tex-Mex Roasted Veggie Quesadillas (SISU Fitness)
(27, 'https://www.sisufitness.com/tex-mex-roasted-veggie-quesadillas/',
ARRAY['2 bell peppers, sliced','1 zucchini, sliced','1 red onion, sliced','1 cup black beans, drained','1 tsp cumin','1 tsp chili powder','1/2 tsp garlic powder','Olive oil','8 flour tortillas','2 cups shredded Monterey Jack or Mexican blend cheese','Salt and pepper to taste'],
ARRAY['Preheat oven to 425°F. Toss bell peppers, zucchini, and red onion with olive oil, cumin, chili powder, garlic powder, salt, and pepper.','Roast vegetables on a baking sheet for 20-25 minutes until tender and slightly charred.','Add black beans to roasted veggies and toss together.','Heat a skillet over medium heat. Place a tortilla down, sprinkle cheese on one half, add a scoop of veggie mixture, fold over.','Cook 2-3 minutes per side until golden and cheese melts. Repeat for remaining quesadillas. Serve with salsa or sour cream.']),

-- 28. Copycat Bacon Cheeseburger Hamburger Helper (SISU Fitness)
(28, 'https://www.sisufitness.com/copycat-bacon-cheeseburger-hamburger-helper/',
ARRAY['1 lb ground beef','6 strips bacon, cooked and crumbled','1.5 cups elbow macaroni (uncooked)','1.5 cups beef broth','1 cup milk','1 cup shredded cheddar cheese','2 tbsp ketchup','1 tbsp Worcestershire sauce','1 tsp garlic powder','1 tsp onion powder','Salt and pepper to taste'],
ARRAY['Cook bacon in a large skillet until crispy. Remove and crumble. Reserve a little grease.','In same skillet, brown ground beef, breaking apart. Drain excess fat.','Add beef broth, milk, macaroni, ketchup, Worcestershire sauce, garlic powder, onion powder, salt, and pepper. Stir to combine.','Bring to a boil, then reduce heat to medium-low. Cover and cook 12-15 minutes, stirring occasionally, until pasta is tender.','Remove from heat. Stir in shredded cheese until melted. Top with crumbled bacon and serve.']),

-- 29. Taco Salad with Pan Fried Tortilla Strips (SISU Fitness)
(29, 'https://www.sisufitness.com/taco-salad-with-pan-fried-tortilla-strips/',
ARRAY['1 lb ground beef or turkey','1 packet taco seasoning','4 cups romaine lettuce, chopped','1 cup cherry tomatoes','1 cup corn (canned)','1 can black beans, drained','1/2 cup shredded cheddar','4 corn tortillas cut into strips','Oil for frying','Salsa, sour cream, or ranch for dressing'],
ARRAY['Cook tortilla strips: heat 1/4 inch of oil in a pan over medium-high. Fry strips in batches 1-2 minutes until golden and crispy. Drain on paper towels and salt immediately.','Brown ground meat in a skillet. Add taco seasoning and a splash of water. Simmer 2-3 minutes. Cool slightly.','Layer salad bowls: romaine on bottom, then beans, corn, tomatoes, and taco meat.','Top with shredded cheese and crispy tortilla strips.','Drizzle with salsa, sour cream, or ranch. Serve immediately or keep components separate for meal prep.']),

-- 30. Honey Sriracha Shrimp Fried Cauliflower Rice (SISU Fitness)
(30, 'https://www.sisufitness.com/honey-sriracha-shrimp-fried-cauliflower-rice/',
ARRAY['1 lb large shrimp, peeled and deveined','4 cups riced cauliflower','2 large eggs','1 cup frozen peas and carrots','3 tbsp low-sodium soy sauce','2 tbsp honey','1 tbsp sriracha (adjust to taste)','1 tsp sesame oil','3 green onions, sliced','2 cloves garlic, minced','1 tbsp olive oil'],
ARRAY['Mix honey, sriracha, soy sauce, and sesame oil together in a small bowl. Toss shrimp with half the sauce and marinate 10 minutes.','Cook shrimp in a hot skillet over high heat 2-3 minutes per side until pink and cooked. Set aside.','In same pan, scramble eggs until just set. Set aside.','Add oil, garlic, cauliflower rice, and peas/carrots to pan. Cook 5-7 minutes, stirring often.','Add cooked eggs, remaining sauce, and shrimp. Toss everything together. Garnish with green onions.']),

-- 31. Microwavable BBQ Chicken Pasta Bake (SISU Fitness)
(31, 'https://www.sisufitness.com/microwavable-bbq-chicken-pasta-bake/',
ARRAY['2 cups cooked chicken, shredded or diced','2 cups cooked pasta (rotini or penne)','1 cup BBQ sauce','1/2 cup chicken broth','1/2 cup shredded cheddar or Monterey Jack cheese','1/4 cup red onion, diced','Salt and pepper to taste'],
ARRAY['Cook pasta according to package directions. Drain.','In a large microwave-safe bowl or dish, combine cooked chicken, pasta, BBQ sauce, chicken broth, and red onion. Stir well.','Season with salt and pepper. Top with shredded cheese.','Microwave on high for 3-4 minutes until heated through and cheese is melted.','Stir gently and serve. Great for meal prep — store in individual containers and microwave 2 minutes to reheat.']),

-- 32. Pan Roasted Corn & Black Bean Burrito Bowls (SISU Fitness)
(32, 'https://www.sisufitness.com/pan-roasted-corn-black-bean-burrito-bowls/',
ARRAY['2 cups corn (frozen or canned, drained)','1 can (15oz) black beans, drained and rinsed','2 cups cooked brown rice','1 red bell pepper, diced','1/4 red onion, diced','1 tsp cumin','1 tsp chili powder','1/2 tsp smoked paprika','1 tbsp olive oil','Salt and pepper to taste','Optional toppings: avocado, salsa, sour cream, lime, cilantro, cheese'],
ARRAY['Heat olive oil in a cast iron skillet or large pan over high heat. Add corn and let sit without stirring 2-3 minutes to char slightly.','Add bell pepper and cook another 3-4 minutes. Add black beans, cumin, chili powder, and smoked paprika. Stir and cook 2 more minutes.','Season with salt, pepper, and a squeeze of lime.','Build bowls: rice on bottom, then corn and bean mixture.','Top with desired toppings like avocado, salsa, sour cream, cheese, or cilantro.']),

-- ============ LUNCH/DINNER - Kay Nutrition (IDs 48-65) ============

-- 48. Korean Beef Meal Prep Bowls (Kay Nutrition)
(48, 'https://kaynutrition.com/korean-beef-meal-prep-bowls/',
ARRAY['1.5 lbs flank steak or beef strips','3 tbsp low-sodium soy sauce','2 tbsp rice vinegar','1 tbsp brown sugar','1 tsp sesame oil','3 cloves garlic, minced','1 tsp fresh ginger, minced','1 tsp cornstarch','2 cups cooked white or brown rice','2 cups broccoli florets, steamed','2 carrots, julienned or sliced','3 green onions, sliced','1 tbsp sesame seeds','1 tbsp vegetable oil'],
ARRAY['Make marinade: mix soy sauce, rice vinegar, brown sugar, sesame oil, garlic, ginger, and cornstarch.','Slice beef thinly against the grain. Toss with marinade and let sit 15-30 minutes.','Heat vegetable oil in a skillet or wok over high heat. Cook beef in batches, 2-3 minutes, until caramelized. Do not crowd the pan.','Steam or stir-fry broccoli and carrots until tender-crisp.','Assemble bowls: rice, then beef, then veggies. Garnish with green onions and sesame seeds. Keep sauce separate for meal prep.']),

-- 49. Turkey Taco Skillet (Kay Nutrition)
(49, 'https://kaynutrition.com/turkey-taco-skillet/',
ARRAY['1 lb ground turkey','1 can (15oz) black beans, drained','1 cup corn (canned or frozen)','1 can (14oz) diced tomatoes','1 small onion, diced','1 red bell pepper, diced','2 cloves garlic, minced','2 tbsp taco seasoning','1/2 cup chicken broth','1 cup shredded Mexican cheese blend','Salt and pepper to taste','Optional: sour cream, avocado, cilantro'],
ARRAY['Cook ground turkey and onion in a large oven-safe skillet over medium heat until browned. Drain fat if needed.','Add garlic and bell pepper and cook 2-3 more minutes.','Add taco seasoning, diced tomatoes, black beans, corn, and chicken broth. Stir well.','Simmer uncovered 10-12 minutes until liquid reduces slightly.','Sprinkle cheese over top and cover with lid (or broil briefly) until melted. Top with optional garnishes and serve.']),

-- 50. Firecracker Beef Meal Prep Bowls (Kay Nutrition)
(50, 'https://kaynutrition.com/firecracker-beef-meal-prep-bowls/',
ARRAY['1.5 lbs ground beef','2 tbsp sriracha','2 tbsp soy sauce','1 tbsp rice vinegar','1 tbsp honey','1 tsp garlic powder','1 tsp ginger powder','2 cups broccoli florets','2 cups carrots, sliced','2 cups cooked white rice','2 green onions, sliced','Sesame seeds for garnish','1 tbsp oil'],
ARRAY['Mix the firecracker sauce: sriracha, soy sauce, rice vinegar, honey, garlic powder, and ginger.','Brown ground beef in a skillet over medium-high heat. Drain fat.','Pour firecracker sauce over beef and stir to coat. Simmer 2-3 minutes.','Steam or stir-fry broccoli and carrots until tender-crisp.','Assemble 4 meal prep bowls: rice base, then firecracker beef, then veggies. Garnish with green onions and sesame seeds.']),

-- 51. Chicken Broccoli Rice Casserole (Kay Nutrition)
(51, 'https://kaynutrition.com/chicken-broccoli-rice-casserole/',
ARRAY['1.5 lbs chicken breast, cubed','3 cups broccoli florets','2 cups cooked white or brown rice','1 can (10.5oz) cream of chicken soup','1/2 cup chicken broth','1 cup shredded cheddar cheese','1/2 tsp garlic powder','1/2 tsp onion powder','Salt and pepper to taste'],
ARRAY['Preheat oven to 375°F. Grease a 9x13 baking dish.','In a large bowl, mix cream of chicken soup with chicken broth, garlic powder, and onion powder.','Add cooked rice, raw chicken cubes, and broccoli to the mixture. Season with salt and pepper. Stir to combine.','Pour into baking dish. Top with shredded cheddar.','Cover with foil and bake 30 minutes. Remove foil and bake another 15 minutes until chicken is cooked through and top is bubbly.']),

-- 52. Greek Turkey Meatballs (Kay Nutrition)
(52, 'https://kaynutrition.com/greek-turkey-meatballs/',
ARRAY['1 lb ground turkey','1/3 cup breadcrumbs','1 large egg','2 cloves garlic, minced','2 tbsp fresh parsley, chopped','1 tbsp fresh mint, chopped','1 tsp dried dill','1/2 tsp dried oregano','Zest of 1 lemon','Salt and pepper to taste','1 cup orzo, cooked','Store-bought or homemade tzatziki for serving'],
ARRAY['Preheat oven to 400°F. Line a baking sheet with parchment.','In a large bowl, combine ground turkey, breadcrumbs, egg, garlic, parsley, mint, dill, oregano, lemon zest, salt, and pepper.','Mix well and roll into 1.5-inch meatballs. Place on prepared baking sheet.','Bake 18-22 minutes until cooked through and lightly browned. (Or pan-fry in oil over medium heat for 8-10 minutes.)','Serve over cooked orzo with tzatziki on the side. Garnish with fresh herbs and lemon.']),

-- 53. Greek Chicken Casserole (Kay Nutrition)
(53, 'https://kaynutrition.com/greek-chicken-casserole/',
ARRAY['1.5 lbs chicken thighs or breasts','1 cup cherry tomatoes, halved','1/2 cup Kalamata olives, pitted','1 cup artichoke hearts (canned), drained','1 red onion, sliced','4 cloves garlic, minced','2 tbsp olive oil','1 tsp dried oregano','1 tsp dried thyme','1/2 cup feta cheese, crumbled','Salt and pepper to taste','Lemon wedges for serving'],
ARRAY['Preheat oven to 400°F.','Season chicken with salt, pepper, oregano, and thyme.','In a large baking dish, combine chicken, tomatoes, olives, artichoke hearts, red onion, and garlic. Drizzle with olive oil and toss.','Bake 35-40 minutes until chicken is cooked through and juices run clear.','Remove from oven, crumble feta on top, and serve with lemon wedges.']),

-- 54. Sheet Pan Chicken and Broccoli (Kay Nutrition)
(54, 'https://kaynutrition.com/sheet-pan-chicken-and-broccoli/',
ARRAY['1.5 lbs chicken breast, cut into chunks','4 cups broccoli florets','3 tbsp soy sauce','2 tbsp olive oil','1 tbsp sesame oil','1 tbsp honey','3 cloves garlic, minced','1/2 tsp ginger powder','Red pepper flakes to taste','Sesame seeds for garnish'],
ARRAY['Preheat oven to 425°F. Line a large baking sheet with parchment paper.','Whisk together soy sauce, olive oil, sesame oil, honey, garlic, and ginger.','Toss chicken and broccoli with the sauce. Spread evenly on baking sheet — do not crowd.','Roast for 20-25 minutes until chicken is cooked through and broccoli is slightly charred.','Garnish with sesame seeds and red pepper flakes. Serve over rice if desired.']),

-- 55. Spaghetti Squash Casserole (Kay Nutrition)
(55, 'https://kaynutrition.com/spaghetti-squash-casserole/',
ARRAY['1 medium spaghetti squash (about 3 lbs)','1 lb ground beef or turkey','1 jar (24oz) marinara sauce','1 cup ricotta cheese','1 cup shredded mozzarella','1/4 cup Parmesan, grated','2 cloves garlic, minced','1 tsp dried Italian seasoning','Salt and pepper to taste'],
ARRAY['Preheat oven to 400°F. Cut squash in half lengthwise, remove seeds, brush with oil, and roast cut-side down for 35-40 minutes until tender.','Scrape spaghetti squash into strands with a fork. Spread in the bottom of a baking dish.','Brown ground meat with garlic in a skillet. Add marinara sauce and simmer 5 minutes. Season with Italian seasoning.','Pour meat sauce over squash. Drop spoonfuls of ricotta over the top.','Sprinkle mozzarella and Parmesan on top. Bake at 375°F for 20-25 minutes until bubbly and golden.']),

-- 56. Spinach Artichoke Chicken Casserole (Kay Nutrition)
(56, 'https://kaynutrition.com/spinach-artichoke-chicken-casserole/',
ARRAY['1.5 lbs chicken breast, cubed','3 cups fresh spinach (or 10oz frozen, thawed and squeezed dry)','1 can (14oz) artichoke hearts, drained and chopped','4 oz cream cheese, softened','1/2 cup sour cream or Greek yogurt','1/2 cup mayonnaise','1 cup shredded mozzarella','1/2 cup Parmesan, grated','3 cloves garlic, minced','Salt and pepper to taste'],
ARRAY['Preheat oven to 375°F. Grease a 9x13 baking dish.','In a large bowl, mix cream cheese, sour cream, mayonnaise, half the mozzarella, Parmesan, and garlic.','Add spinach, artichoke hearts, and raw chicken cubes. Season with salt and pepper. Stir to combine.','Spread in baking dish. Top with remaining mozzarella.','Bake 35-40 minutes until chicken is cooked through, bubbly, and top is golden.']),

-- 57. Shredded Beef Tacos (Kay Nutrition)
(57, 'https://kaynutrition.com/shredded-beef-tacos/',
ARRAY['2.5 lbs beef chuck roast','1 can (14oz) diced tomatoes with green chiles','1 small onion, diced','4 cloves garlic, minced','2 tbsp taco seasoning','1 tsp cumin','1/2 cup beef broth','Salt and pepper to taste','Corn or flour tortillas for serving','Toppings: salsa, avocado, sour cream, cheese, cilantro'],
ARRAY['Season beef with salt, pepper, and taco seasoning. Place in slow cooker.','Add diced tomatoes, onion, garlic, cumin, and beef broth over the beef.','Cook on LOW 8-10 hours or HIGH 5-6 hours until very tender.','Remove beef and shred with two forks. Return to slow cooker and mix with the juices.','Serve in warm tortillas with desired toppings.']),

-- 58. Beef Shawarma (Kay Nutrition)
(58, 'https://kaynutrition.com/beef-shawarma/',
ARRAY['1.5 lbs beef (sirloin or flank steak), sliced thin','1 tsp cumin','1 tsp coriander','1 tsp paprika','1/2 tsp turmeric','1/4 tsp cinnamon','3 cloves garlic, minced','2 tbsp olive oil','2 tbsp lemon juice','Salt and pepper to taste','Pita bread, hummus, tomatoes, cucumber, red onion for serving'],
ARRAY['Combine cumin, coriander, paprika, turmeric, cinnamon, garlic, olive oil, and lemon juice. Add beef and marinate at least 30 minutes.','Heat a large skillet or grill pan over high heat. Cook beef in batches 2-3 minutes per side for medium or until cooked through.','Let rest 2-3 minutes, then slice if needed.','Serve in warm pita with hummus, tomatoes, cucumber, and red onion. A garlic yogurt sauce or tahini sauce is also great.']),

-- 59. Ground Turkey Meal Prep Bowls (Kay Nutrition)
(59, 'https://kaynutrition.com/ground-turkey-meal-prep-bowls/',
ARRAY['1 lb ground turkey','1 small onion, diced','2 cloves garlic, minced','1 cup cherry tomatoes, halved','2 cups zucchini, diced','1 tsp dried Italian seasoning','1 tsp paprika','2 cups cooked rice or quinoa','Salt and pepper to taste','1 tbsp olive oil'],
ARRAY['Heat olive oil in a large skillet over medium-high. Cook onion 3-4 minutes. Add garlic and cook 1 more minute.','Add ground turkey, breaking apart, and cook until browned. Drain any excess fat.','Add zucchini and cherry tomatoes. Season with Italian seasoning, paprika, salt, and pepper. Cook 5-7 minutes until veggies are tender.','Divide rice or quinoa into 4 meal prep containers. Top with turkey and veggie mixture.','Refrigerate up to 5 days. Reheat in microwave 2-3 minutes.']),

-- 60. Stuffed Pepper Casserole (Kay Nutrition)
(60, 'https://kaynutrition.com/stuffed-pepper-casserole/',
ARRAY['1 lb ground beef or turkey','3 bell peppers (any colors), diced','1 small onion, diced','3 cloves garlic, minced','1 can (14oz) diced tomatoes','1 cup tomato sauce','1 cup cooked rice','1 tsp dried Italian seasoning','1 tsp paprika','1 cup shredded mozzarella','Salt and pepper to taste','1 tbsp olive oil'],
ARRAY['Preheat oven to 375°F.','Heat olive oil in a large oven-safe skillet or pot over medium heat. Cook onion and peppers 5 minutes. Add garlic and cook 1 more minute.','Add ground meat and brown, breaking apart. Drain fat.','Add diced tomatoes, tomato sauce, cooked rice, Italian seasoning, and paprika. Stir well and season with salt and pepper.','Transfer to a greased baking dish (if needed). Top with shredded mozzarella. Bake 20-25 minutes until bubbly and cheese is golden.']),

-- 61. Beef and Mushroom Stew (Kay Nutrition)
(61, 'https://kaynutrition.com/beef-and-mushroom-stew/',
ARRAY['2 lbs beef stew meat (chuck), cubed','3 cups mushrooms, quartered','3 carrots, sliced','3 potatoes, cubed','1 onion, diced','4 cloves garlic, minced','2 cups beef broth','1 cup red wine (or additional broth)','2 tbsp tomato paste','1 tsp dried thyme','1 tsp dried rosemary','2 tbsp flour','2 tbsp olive oil','Salt and pepper to taste'],
ARRAY['Season beef with salt, pepper, and flour. Heat oil in a Dutch oven or large pot over medium-high heat and brown beef in batches.','Remove beef. Add onion and garlic to pot and cook 3 minutes. Add mushrooms and cook 5 more minutes.','Add tomato paste and stir 1 minute. Add broth, wine, thyme, and rosemary.','Return beef to pot. Bring to a boil, then reduce to low and simmer covered 1.5-2 hours (or slow cooker LOW 8 hours).','Add carrots and potatoes in the last 30 minutes. Season to taste before serving.']),

-- 62. Sheet Pan Steak Fajitas (Kay Nutrition)
(62, 'https://kaynutrition.com/sheet-pan-steak-fajitas/',
ARRAY['1.5 lbs flank or skirt steak, sliced thin','3 bell peppers (red, green, yellow), sliced','1 large onion, sliced','2 tbsp olive oil','1 tbsp chili powder','1 tsp cumin','1 tsp garlic powder','1/2 tsp smoked paprika','Salt and pepper','Flour or corn tortillas for serving','Toppings: sour cream, avocado, lime, cilantro'],
ARRAY['Preheat oven to 425°F. Line a large sheet pan with parchment or foil.','Mix chili powder, cumin, garlic powder, paprika, salt, and pepper together.','Toss steak, peppers, and onion with olive oil and the spice mix. Spread in a single layer on sheet pan.','Roast 15-20 minutes until steak reaches your desired doneness and veggies are tender with edges charred.','Serve in warm tortillas with toppings of choice.']),

-- 63. Sheet Pan Bruschetta Chicken (Kay Nutrition)
(63, 'https://kaynutrition.com/sheet-pan-bruschetta-chicken/',
ARRAY['1.5 lbs chicken breasts (4 medium)','2 cups cherry tomatoes, halved','4 cloves garlic, minced','1/4 cup fresh basil, chopped','3 tbsp olive oil','2 tbsp balsamic vinegar','1 cup shredded mozzarella','Salt and pepper to taste'],
ARRAY['Preheat oven to 400°F. Line a sheet pan with parchment.','Mix tomatoes, garlic, basil, 2 tbsp olive oil, and balsamic vinegar together in a bowl. Season with salt and pepper.','Pound chicken breasts to even thickness. Season with salt and pepper and remaining olive oil.','Place chicken on sheet pan. Top each breast with a spoonful of the tomato mixture and some mozzarella.','Bake 25-30 minutes until chicken is cooked through and cheese is melted and slightly golden.']),

-- 64. Chicken Burrito Casserole (Kay Nutrition)
(64, 'https://kaynutrition.com/chicken-burrito-casserole/',
ARRAY['1.5 lbs chicken breast, cooked and shredded','1 can (15oz) black beans, drained','1 cup corn (canned or frozen)','1 cup salsa','1 cup sour cream or Greek yogurt','2 cups cooked rice','8 small flour tortillas, cut into strips or quarters','2 cups shredded Mexican cheese blend','1 tsp cumin','1 tsp chili powder','Salt and pepper to taste'],
ARRAY['Preheat oven to 375°F. Grease a 9x13 baking dish.','In a large bowl, mix shredded chicken, black beans, corn, salsa, sour cream, rice, cumin, chili powder, salt, and pepper.','Layer half the tortilla pieces in the bottom of the baking dish. Spread half the chicken mixture over top. Sprinkle with half the cheese.','Add remaining tortillas, then remaining chicken mixture, then remaining cheese on top.','Bake uncovered 30-35 minutes until bubbly and cheese is golden. Rest 5 minutes before serving.']),

-- 65. Meal Prep Instant Noodle Cups (Kay Nutrition)
(65, 'https://kaynutrition.com/meal-prep-instant-noodle-cups/',
ARRAY['2 packages rice noodles or ramen noodles','2 cups cooked chicken, shredded or diced','2 cups chicken broth (liquid to add at serving)','2 tbsp low-sodium soy sauce','1 tbsp rice vinegar','1 tsp sesame oil','1 tsp ginger powder','1 cup shredded carrots','1 cup baby spinach or bok choy','3 green onions, sliced','Red pepper flakes to taste'],
ARRAY['Break dry noodles into mason jars or meal prep containers (do not cook yet).','Layer in each jar: noodles, then shredded chicken, then carrots and spinach.','Mix sauce: soy sauce, rice vinegar, sesame oil, ginger, and red pepper flakes. Divide among jars.','Top each with sliced green onions. Seal and refrigerate up to 4 days.','At serving: pour boiling chicken broth over everything until noodles are submerged. Seal, wait 3-5 minutes, stir, and eat.']),

-- ============ SIDES (IDs 66-67) ============

-- 66. Air Fryer Broccoli (Eating Bird Food)
(66, 'https://www.eatingbirdfood.com/air-fryer-broccoli/',
ARRAY['4 cups broccoli florets','2 tbsp olive oil','1/2 tsp garlic powder','Salt and pepper to taste','Optional: Parmesan cheese, lemon juice, red pepper flakes'],
ARRAY['Preheat air fryer to 375°F.','Toss broccoli florets with olive oil, garlic powder, salt, and pepper.','Spread in a single layer in the air fryer basket (work in batches if needed).','Air fry for 8-10 minutes, shaking halfway, until edges are crispy and broccoli is tender.','Optional: sprinkle with Parmesan or squeeze lemon juice over top before serving.']),

-- 67. Honey Mustard Pan Roasted Brussels Sprouts (SISU Fitness)
(67, 'https://www.sisufitness.com/honey-mustard-pan-roasted-brussels-sprouts/',
ARRAY['1 lb Brussels sprouts, trimmed and halved','2 tbsp olive oil','2 tbsp Dijon mustard','1 tbsp honey','1 tbsp apple cider vinegar','2 cloves garlic, minced','Salt and pepper to taste'],
ARRAY['Whisk together Dijon mustard, honey, apple cider vinegar, and garlic in a small bowl to make the honey mustard sauce.','Heat olive oil in a large skillet over medium-high heat.','Add Brussels sprouts cut-side down. Cook undisturbed 5-6 minutes until well-browned on one side.','Flip sprouts, season with salt and pepper, and cook another 4-5 minutes until tender.','Pour honey mustard sauce over sprouts and toss to coat. Cook 1-2 more minutes until sauce is caramelized. Serve hot.'])

ON CONFLICT (recipe_id) DO UPDATE SET
  url = EXCLUDED.url,
  ingredients = EXCLUDED.ingredients,
  steps = EXCLUDED.steps;
