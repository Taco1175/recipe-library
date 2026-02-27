# 🍽 Recipe Library

Personal meal planning app with grocery list generation, fridge matching, and recipe auto-fetch.

**Live site:** https://cowpushing-meals.netlify.app

---

## Running Locally

Local dev uses the **Netlify CLI**, which runs your serverless functions locally — no deployments needed, no credit usage.

### 1. Install Netlify CLI (once)

```bash
npm install -g netlify-cli
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase URL and anon key (Supabase Dashboard → Project Settings → API).

**Or** pull them directly from Netlify after linking (step 3):

```bash
netlify env:pull .env
```

### 3. Link to your Netlify site (once)

```bash
netlify link
```

Choose "Use current git remote" — it'll detect `cowpushing-meals.netlify.app` automatically.

### 4. Start the dev server

```bash
netlify dev
```

Opens at **http://localhost:8888** with full functions + hot reload. No deployments, no credits used.

---

## Deploying to Production

Pushes to `main` auto-deploy via GitHub. No manual deploys needed.

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
- **Hosting:** Netlify (auto-deploy from GitHub)
