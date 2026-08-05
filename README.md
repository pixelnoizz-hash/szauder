# davidarielszauder.com

Astro site. Content lives in Markdown files, so it stays yours whatever happens
to any tool used to edit it.

---

## Putting it online — 20 minutes, no coding

### 1. Create the repository

On GitHub, click **New repository**. Name it `szauder`. Leave it empty — no README,
no .gitignore. Set it to Private if you prefer.

### 2. Upload these files

On the new repo's page: **Add file → Upload files**. Drag in everything from this
folder **except `node_modules` and `dist`** (those rebuild automatically).
Click **Commit changes**.

### 3. Connect Cloudflare Pages

Sign up at Cloudflare, then **Workers & Pages → Create → Pages → Connect to Git**.
Choose the `szauder` repo. Cloudflare should detect the settings; if it asks:

- Framework preset: **Astro**
- Build command: `npm run build`
- Build output directory: `dist`

Click **Save and Deploy**. In about a minute you get a live address like
`szauder.pages.dev`. Open it on your phone.

### 4. The domain — last, not first

Only after the site looks right: Cloudflare → your project → **Custom domains**.
Add `davidarielszauder.com`.

Check first where the domain is currently registered. If it sits inside Squarespace
you may need to transfer it out, which can take several days. **Do not cancel
Squarespace until the new site is live on the real domain.** The two can run in
parallel at no risk.

---

## Editing afterwards

### Content — you, no code

Go to `yourdomain.com/admin`. Log in with GitHub. Add a work, change text, upload
images, publish. The site rebuilds itself in about a minute.

Before this works, open `public/admin/config.yml` and replace `USERNAME/szauder`
on the `repo:` line with your actual GitHub username.

### Design and structure — bring it back to Claude

New sections, layout changes, a new subpage, typography. Paste `NOTES.md` into the
conversation first — Claude does not remember previous sessions, and that file
carries every decision behind how this looks.

---

## What is where

```
src/content/works/     one Markdown file per work — text lives here
src/assets/works/      source images (Astro resizes and converts these itself)
src/pages/index.astro  the home page
src/components/        the Work block, reused for every project
src/layouts/Base.astro navigation, footer, shared scripts
public/admin/          the editing interface
NOTES.md               why the site looks the way it does — read before changing it
```

Adding a work: copy any file in `src/content/works/`, change the fields, drop the
images into `src/assets/works/`. The home page picks it up by the `order:` number.

---

## Running it on your own machine (optional)

Needs Node 20+.

```bash
npm install
npm run dev      # http://localhost:4321
```

You never have to do this. Cloudflare builds it for you on every change.
