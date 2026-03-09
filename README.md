# 🍽 Recipe Library

Personal meal planning and recipe management app — self-hosted on a Raspberry Pi.

Fetch recipes from URLs, build grocery lists, match ingredients to your fridge, and plan meals by week.

**Live site:** https://mealplannr.xyz

---

## Stack

- **Frontend:** Vanilla JS, HTML/CSS — no build step
- **Backend:** Node.js API server (`backend/`)
- **Database:** PocketBase (self-hosted)
- **Hosting:** Raspberry Pi (self-hosted, served via nginx)

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `develop` | All new changes go here — test locally |
| `main` | Production — merge when ready to deploy |

---

## Local Dev Setup

### 1. Clone and switch to develop

```bash
git clone https://github.com/Taco1175/recipe-library.git
cd recipe-library
git checkout develop
```

### 2. Set up environment

```bash
cp .env.example .env
# Fill in your PocketBase URL and admin credentials
```

### 3. Start the API server

```bash
cd backend
npm install
npm run dev
# API runs at http://localhost:3000
```

### 4. Open the frontend

Open `public/index.html` directly in a browser, or serve with any static server.

---

## Project Structure

```
public/
  index.html          # Main app (recipe library + grocery list)
  planner.html        # Meal planner
  recipe.html         # Single recipe view
  login.html          # Auth page
  privacy.html        # Privacy policy
  shared.css          # Shared styles
  auth.js             # Auth helpers
  sidebar.js          # Shared sidebar
backend/
  server.js           # Express API server
  api/
    recipes.js        # Recipe CRUD
    recipe-details.js # Ingredients + steps
    fetch-recipe.js   # URL scraper
    grocery-list.js   # Grocery list generation
    match-ingredients.js
    library-shares.js
    user-preferences.js
.github/
  workflows/
    deploy.yml        # Auto-deploy to Pi on push to main
```
