# 🍽 Recipe Library

Personal meal planning app with grocery list generation, fridge matching, and recipe auto-fetch.

**Live site:** https://cowpushing-meals.netlify.app

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `develop` | All new changes go here — test locally |
| `main` | Production only — merge when ready to go live |

All changes are pushed to `develop`. Merge to `main` when you're happy to deploy.

---

## Local Dev Setup (one time)

### 1. Install Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. Clone and switch to develop

```bash
git clone https://github.com/Taco1175/recipe-library.git
cd recipe-library
git checkout develop
```

### 3. Link to your Netlify site

```bash
netlify link
# Choose "Use current git remote"
```

### 4. Pull environment variables

```bash
netlify env:pull .env
```

### 5. Start the dev server

```bash
netlify dev
# Opens at http://localhost:8888
```

---

## Daily Workflow

```bash
# Pull latest changes from develop
git pull origin develop

# Start local server
netlify dev

# When ready to go live, merge develop → main on GitHub
# This auto-deploys to Netlify — no manual deploy needed
```

---

## Project Structure

```
public/
  index.html              # Entire frontend (single file)
netlify/
  functions/
    fetch-recipe.js       # Scrapes recipe URLs for ingredients
    extra-recipes.js      # CRUD for recipes in Supabase
    recipe-details.js     # Ingredients + steps storage
    structured-ingredients.js  # Grocery list generation
migrations/
  *.sql                   # Supabase schema migrations
netlify.toml              # Build + functions config
.env.example              # Environment variable template
```

## Tech Stack

- **Frontend:** Vanilla JS, single HTML file
- **Backend:** Netlify Functions (Node.js)
- **Database:** Supabase (Postgres)
- **Hosting:** Netlify (auto-deploy from main branch only)
