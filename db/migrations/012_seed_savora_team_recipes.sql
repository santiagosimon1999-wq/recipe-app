-- ============================================================================
-- 012 — Seed Savora team starter recipes (generated)
-- ============================================================================
-- Prerequisites (run once in Supabase Auth + SQL):
-- 1. Create a user account you will use as the system chef (email/password or OAuth).
-- 2. Set profiles.username = 'savora-team' and display_name = 'Savora Chef' for that user.
--
-- Idempotent — skips rows that already exist for savora-team with the same title.
-- Regenerate this file: npm run seed:generate-sql

DO $$
DECLARE
  team_id uuid;
BEGIN
  SELECT id INTO team_id
  FROM public.profiles
  WHERE lower(username) = 'savora-team'
  LIMIT 1;

  IF team_id IS NULL THEN
    RAISE EXCEPTION 'Profile with username savora-team not found. Create the user and profile first.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Greek Chicken Salad'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Greek Chicken Salad',
      'A fresh Mediterranean salad with grilled chicken, cucumber, tomato, and olive oil.',
      ARRAY['200g chicken breast', '1 tomato', '1 cucumber', '1/2 onion', '1 tbsp olive oil', '1 cup lettuce']::text[],
      'Season and grill the chicken. Chop the vegetables. Slice the chicken and combine everything in a bowl. Drizzle with olive oil and serve.',
      'Mediterranean',
      'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80',
      420,
      36,
      14,
      24,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Veggie Stir Fry Rice Bowl'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Veggie Stir Fry Rice Bowl',
      'A colorful Asian-style rice bowl with stir-fried vegetables and simple seasoning.',
      ARRAY['1 cup rice', '1 carrot', '1 bell pepper', '1 cup broccoli', '1 tbsp olive oil', '1/2 onion']::text[],
      'Cook the rice. Slice the vegetables. Stir fry the onion, carrot, pepper, and broccoli in olive oil. Serve the vegetables over rice.',
      'Asian',
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80',
      390,
      10,
      60,
      12,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Black Bean Taco Bowl'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Black Bean Taco Bowl',
      'A Mexican-inspired bowl with black beans, rice, tomato, and onion.',
      ARRAY['1 cup black beans', '1 cup rice', '1 tomato', '1/2 onion', '1 tbsp olive oil']::text[],
      'Cook the rice. Heat the black beans. Chop the tomato and onion. Assemble in a bowl and finish with olive oil.',
      'Mexican',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
      510,
      16,
      82,
      12,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Creamy Pasta Bowl'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Creamy Pasta Bowl',
      'A simple Italian pasta bowl with cheese, tomato, and onion.',
      ARRAY['1 cup pasta', '100g cheese', '1 tomato', '1/2 onion', '1 tbsp olive oil']::text[],
      'Cook the pasta. Sauté onion and tomato in olive oil. Toss with pasta and melt in the cheese before serving.',
      'Italian',
      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80',
      610,
      22,
      74,
      24,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Chickpea Curry Bowl'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Chickpea Curry Bowl',
      'A cozy Indian-inspired chickpea bowl with onion, tomato, and rice.',
      ARRAY['1 cup chickpeas', '1 cup rice', '1 tomato', '1 onion', '1 tbsp olive oil']::text[],
      'Cook the rice. Sauté onion and tomato in olive oil. Add chickpeas and simmer briefly. Serve over rice.',
      'Indian',
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80',
      540,
      18,
      78,
      14,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Roasted Sweet Potato Plate'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Roasted Sweet Potato Plate',
      'A satisfying vegan plate with roasted sweet potato, chickpeas, and spinach.',
      ARRAY['1 sweet potato', '1 cup chickpeas', '1 cup spinach', '1 tbsp olive oil']::text[],
      'Roast the sweet potato. Warm the chickpeas. Plate with spinach and drizzle olive oil on top.',
      'Vegan',
      NULL,
      430,
      13,
      58,
      16,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Cheesy Veggie Omelet'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Cheesy Veggie Omelet',
      'A protein-rich vegetarian omelet with cheese, onion, and tomato.',
      ARRAY['3 eggs', '50g cheese', '1/2 onion', '1 tomato', '1 tsp olive oil']::text[],
      'Beat the eggs. Cook onion and tomato lightly in olive oil. Add eggs and cheese, fold, and cook until set.',
      'Vegetarian',
      'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=1200&q=80',
      360,
      24,
      8,
      26,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Banana Oat Parfait'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Banana Oat Parfait',
      'A quick dessert made with oats, banana, yogurt, and honey.',
      ARRAY['1 banana', '1 cup yogurt', '1/2 cup oats', '1 tbsp honey']::text[],
      'Layer yogurt, oats, and sliced banana in a glass or bowl. Drizzle with honey and chill before serving.',
      'Desserts',
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80',
      320,
      12,
      52,
      7,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Homestyle Burger Plate'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Homestyle Burger Plate',
      'A fast food-style burger plate with beef, bread, and onion.',
      ARRAY['150g ground beef', '2 slices bread', '1/2 onion', '1 tomato', '1 tbsp olive oil']::text[],
      'Shape and cook the beef patty. Toast the bread. Assemble with onion and tomato, then serve warm.',
      'Fast Food',
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
      690,
      32,
      38,
      42,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Party Nacho Bowl'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Party Nacho Bowl',
      'A simple party-style bowl with beans, cheese, tomato, and crunchy sides.',
      ARRAY['1 cup black beans', '75g cheese', '1 tomato', '1/2 onion', '2 slices bread']::text[],
      'Warm the beans. Chop the vegetables. Toast the bread into crispy pieces and serve everything layered with cheese.',
      'Party Food',
      'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=1200&q=80',
      560,
      20,
      48,
      30,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Mini Breakfast Toasts'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Mini Breakfast Toasts',
      'Kid-friendly breakfast toasts with banana and honey.',
      ARRAY['2 slices bread', '1 banana', '1 tsp butter', '1 tsp honey']::text[],
      'Toast the bread. Spread butter lightly. Top with banana slices and drizzle with honey.',
      'Kids Food',
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80',
      260,
      6,
      42,
      8,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Lentil Tomato Soup'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Lentil Tomato Soup',
      'A warm bowl of lentil soup with tomato, onion, and garlic.',
      ARRAY['1 cup lentils', '1 tomato', '1 onion', '2 cloves garlic', '1 tbsp olive oil']::text[],
      'Sauté onion and garlic in olive oil. Add tomato and lentils with water. Simmer until tender and serve hot.',
      'Soups and Stews',
      'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
      310,
      16,
      44,
      8,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Fresh Garden Salad'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Fresh Garden Salad',
      'A light salad with lettuce, cucumber, tomato, and olive oil.',
      ARRAY['1 cup lettuce', '1 cucumber', '1 tomato', '1/2 onion', '1 tbsp olive oil']::text[],
      'Chop all vegetables, combine in a bowl, and dress with olive oil.',
      'Salads',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
      180,
      3,
      11,
      14,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Chicken Rice Bowl'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Chicken Rice Bowl',
      'A balanced main course with chicken, rice, and vegetables.',
      ARRAY['200g chicken breast', '1 cup rice', '1 tbsp olive oil', '1 tomato', '1/2 onion', '1 cup broccoli']::text[],
      'Cook the rice. Grill the chicken. Chop the vegetables and steam the broccoli. Plate everything together and drizzle with olive oil.',
      'Main Courses',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
      754,
      68,
      62,
      23,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Garlic Bread Bites'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Garlic Bread Bites',
      'A quick appetizer with toasted bread, garlic, and butter.',
      ARRAY['2 slices bread', '2 cloves garlic', '1 tbsp butter']::text[],
      'Toast the bread. Mix butter with minced garlic. Spread over bread and cut into small bites.',
      'Appetizers',
      NULL,
      240,
      5,
      24,
      14,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Global Grain Bowl'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Global Grain Bowl',
      'An international-style grain bowl with rice, beans, and vegetables.',
      ARRAY['1 cup rice', '1 cup beans', '1 tomato', '1 cucumber', '1 tbsp olive oil']::text[],
      'Cook the rice. Warm the beans. Chop the vegetables and assemble everything in a bowl.',
      'International',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
      470,
      15,
      72,
      12,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Breakfast Oat Bowl'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Breakfast Oat Bowl',
      'A simple breakfast bowl with oats, milk, banana, and honey.',
      ARRAY['1 cup oats', '1 cup milk', '1 banana', '1 tbsp honey']::text[],
      'Cook the oats with milk. Top with banana slices and honey.',
      'Breakfast',
      'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=1200&q=80',
      340,
      11,
      55,
      8,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Grilled Salmon Plate'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Grilled Salmon Plate',
      'A grilled salmon meal with vegetables and a light side.',
      ARRAY['200g salmon', '1 cup broccoli', '1 tomato', '1 tbsp olive oil']::text[],
      'Grill the salmon. Steam the broccoli. Serve with tomato and olive oil.',
      'Grilled',
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80',
      480,
      42,
      12,
      28,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'Low Carb Chicken Plate'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'Low Carb Chicken Plate',
      'A low carb plate with chicken, spinach, and mushrooms.',
      ARRAY['200g chicken breast', '1 cup spinach', '1 cup mushroom', '1 tbsp olive oil']::text[],
      'Cook the chicken. Sauté mushrooms and spinach in olive oil. Serve together.',
      'Low Carb',
      NULL,
      350,
      39,
      9,
      17,
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.user_id = team_id AND r.title = 'High Protein Power Bowl'
  ) THEN
    INSERT INTO public.recipes (
      user_id,
      title,
      description,
      ingredients,
      instructions,
      category,
      image_url,
      calories,
      protein,
      carbs,
      fat,
      is_public
    ) VALUES (
      team_id,
      'High Protein Power Bowl',
      'A high protein bowl with chicken, eggs, and rice.',
      ARRAY['200g chicken breast', '2 eggs', '1 cup rice', '1 cup broccoli']::text[],
      'Cook the rice. Grill the chicken. Boil the eggs. Steam the broccoli and assemble the bowl.',
      'High Protein',
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80',
      670,
      64,
      48,
      24,
      true
    );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
