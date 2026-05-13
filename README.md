# GitCMS

GitCMS is a headless CMS that uses a GitHub repository as its database. There is no Postgres, no S3 bucket, no separate admin schema. Every piece of content is a JSON file in a repo you own, and every save is a commit pushed through the GitHub API. The dashboard scaffolds a Next.js starter site into a fresh repo for you, and the editor previews your edits in a real Next dev server running in the browser (via StackBlitz WebContainers) so you can see how your changes will look before you publish.

This README is written for someone trying to clone the project and run it on their own machine for the first time. If you only want to look at the code, skim the "What's in the box" section at the bottom. If you want it running, follow the steps top to bottom.

## What you need before you start

1. **Node.js 20 or newer.** The app is built and tested on Node 24. Older Node will probably work for the dashboard but the WebContainer preview is sensitive to runtime quirks, so use a current LTS or newer. Check with `node -v`.
2. **A GitHub account.** GitCMS authenticates through GitHub OAuth and writes commits using your token. There is no other auth path.
3. **A modern Chromium-based browser** (Chrome, Edge, Brave, Arc). The live preview pane uses `SharedArrayBuffer`, which requires the page to be cross-origin isolated. It works fine in Chrome. **Safari is known not to work for the preview** because of how it handles COOP/COEP for embedded contexts. The dashboard and editor still load in Safari, but the right-hand preview will show a fallback panel with a link to the GitHub repo instead of a rendered page.
4. **A free Vercel-style port (3000)** on localhost. The OAuth callback is registered against `http://localhost:3000`, so the app needs to run there.

You do **not** need Docker, a database, a media bucket, or any cloud account besides GitHub.

## Step 1: Clone and install

```bash
git clone <your-fork-or-the-submitted-zip>/GitCMS.git
cd GitCMS/gitcms
npm install
```

Installing takes a minute or two. There is a second `node_modules/` inside `templates/next-blog/` that is also installed during this step — that template is the starter site GitCMS will copy into every new repo it scaffolds.

## Step 2: Register a GitHub OAuth App

GitCMS signs you in with GitHub and uses the resulting token to read and write files in your repositories. To get a working token in development, you need to register a GitHub OAuth App against your own account.

1. Go to [github.com/settings/developers](https://github.com/settings/developers) and click **New OAuth App**.
2. Fill in the form:
   - **Application name:** anything (e.g. `GitCMS Local`)
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
3. Click **Register application**. On the page that opens, copy the **Client ID**, then click **Generate a new client secret** and copy that value too. The secret is only shown once.

The OAuth scopes are requested by GitCMS automatically (`read:user`, `user:email`, `repo`). You do not configure them on GitHub's side.

## Step 3: Configure environment variables

Copy the example file and fill in the values you just generated:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

```env
GITHUB_CLIENT_ID=<your client id from step 2>
GITHUB_CLIENT_SECRET=<your client secret from step 2>
NEXTAUTH_SECRET=<a random base64 string>
NEXTAUTH_URL=http://localhost:3000
```

For `NEXTAUTH_SECRET`, you can generate a suitable value with:

```bash
openssl rand -base64 32
```

(On Windows without OpenSSL, any sufficiently long random string of letters and digits will do for local testing.)

## Step 4: Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000`. You should see the landing page. Click **Sign in with GitHub**, accept the OAuth prompt, and you will be redirected to the dashboard.

The first sign-in will ask you to authorize the app against repositories on your account. The `repo` scope is requested because GitCMS needs to create new repos and push commits to them. If you would rather not grant full repo access, GitHub offers fine-grained tokens, but the app currently uses the classic OAuth flow.

## Step 5: Create your first site

The dashboard will initially be empty because GitCMS only lists repos that contain a `.gitcms/config.json` marker file. To create your first site:

1. Click **+ New Site** on the dashboard.
2. Enter a repo name. The name must use only letters, digits, dots, underscores, and hyphens; it must not start with a dot or hyphen; and it must not already exist on your account.
3. Choose public or private.
4. Click **Create**.

GitCMS will create a fresh GitHub repository under your account, push the entire starter template (a small Next.js 15 blog site) into it as one commit, drop a `.gitcms/config.json` marker into the repo so the dashboard will recognize it next time, and redirect you straight into the editor to write your first post.

If the scaffold fails halfway through (rare, but possible if GitHub rate-limits the API in the middle of the blob-tree-commit chain), it can leave behind an empty repo on your account. You can delete it manually from GitHub. Rolling back automatically would require the `delete_repo` OAuth scope, which GitCMS does not request.

## Step 6: Write and preview content

The editor has two panes. The left side is the form with the title, slug, excerpt, cover image, status (draft/published), and a rich-text body powered by TipTap. The right side is a live preview of your site.

A few things worth knowing about the preview:

- **First boot is slow.** When you open the editor for a new repo, the preview pane downloads your repo's contents, mounts them into a WebContainer, runs `npm install` inside the browser, and starts `next dev` against the result. On a fast connection this takes about thirty to sixty seconds. The terminal pane below the preview streams the actual install and dev-server output so you can see where it is. Subsequent edits are nearly instant because the dev server hot-reloads.
- **The preview re-renders as you type.** A debounced effect writes the in-progress JSON to the WebContainer filesystem about a quarter second after you stop typing, then nudges the iframe to reload. You will see your draft live in the preview pane even though nothing has been committed yet.
- **Drafts only render in the preview.** The site template only shows posts/pages with `status: "published"` when deployed for real. In the preview, the editor passes a `GITCMS_PREVIEW=1` environment variable to the running Next process, which is what makes drafts visible. If you deploy the same content to Vercel, the draft routes will 404 until you publish.
- **Hit Save to commit.** "Save" pushes the JSON to GitHub as a commit on the default branch. The commit message is auto-generated from the content type and title. Refresh GitHub afterwards and you will see the commit, the file, and the full history.

Use the desktop/tablet/mobile toggles above the preview to check responsive layouts. The fullscreen button maximizes the preview; press Escape to exit.

## Step 7 (optional): Deploy the site you just created

GitCMS itself does not host your site. The repo it scaffolds is a normal Next.js project, and the easiest way to put it online is Vercel:

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import the new repository GitCMS just created on your GitHub account.
3. Accept the defaults and deploy.

Every time you save in GitCMS, the resulting commit will trigger a redeploy on Vercel. There is no webhook to configure on GitCMS's side; Vercel watches the repo directly.

## Troubleshooting

**The preview pane shows a "Cross-origin isolation required" panel.**
Your browser does not have `crossOriginIsolated === true` on `/editor/*`. This is expected in Safari and in any browser that has aggressive privacy or extension settings interfering with COOP/COEP headers. Try a clean Chrome window. If you have unusual extensions, disable them. The headers themselves are set in `next.config.ts` and apply to `/editor/*`, `/_next/*`, and `/api/*`.

**The preview pane is stuck on "installing".**
Open the terminal pane below the preview. `npm install` inside a WebContainer is slower than a normal install and can stall on a flaky network. The first install is the slow one; future boots reuse the same pipeline within the page. If it genuinely hangs for more than two minutes, refresh the editor page; the WebContainer instance will be torn down and rebooted.

**Sign-in redirects me to `localhost` but the page never loads.**
Check that `NEXTAUTH_URL` in `.env.local` exactly matches the OAuth callback URL you registered (`http://localhost:3000`, no trailing slash, http not https). If you change ports, you need to update both the env var and the OAuth app's callback URL.

**The dashboard is empty even after I sign in.**
GitCMS only lists repos that contain `.gitcms/config.json`. New accounts will have nothing until you click **+ New Site** to scaffold one. Repos created outside GitCMS will not appear in the dashboard unless you manually add that marker file to them.

**"A repository with that name already exists."**
Pick a different name. GitCMS will not overwrite or take over an existing repo.

**My OAuth secret leaked / I want to rotate it.**
Generate a new client secret on the OAuth app page, paste it into `.env.local`, and restart `npm run dev`. The old secret stops working immediately.

## What's in the box

The repository has two parts:

```
gitcms/
├── src/                   the GitCMS app itself
│   ├── app/
│   │   ├── page.tsx       landing page
│   │   ├── login/         GitHub sign-in
│   │   ├── dashboard/     repo + content list
│   │   ├── editor/        two-pane editor with WebContainer preview
│   │   └── api/
│   │       ├── auth/      NextAuth (GitHub provider)
│   │       ├── repos/
│   │       │   ├── connected/  lists repos that have a .gitcms/config.json
│   │       │   └── scaffold/   creates a new repo + pushes the template
│   │       ├── content/   read/write JSON files in a repo
│   │       ├── assets/    media upload (currently mocked, see below)
│   │       └── webcontainer-bundle/  builds the file tree for the preview
│   ├── components/        editor, preview pane, dialogs, etc.
│   └── lib/               github, octokit, template loader, types
└── templates/
    └── next-blog/         the starter site every new repo gets
        ├── app/
        ├── content/       posts/ and pages/ JSON files
        └── lib/content.ts file-based content loader
```

A few things to know about how it's built:

- The starter template is pinned to **Next 15.4.6** on purpose. Next 16 defaults to Turbopack, which is a native Rust binary and does not run inside a WebContainer. Next 15.5.x has a `workUnitAsyncStorage` invariant bug that crashes the preview. 15.4.6 is the most recent version that boots cleanly inside the browser.
- Media uploads are **mocked**. `src/lib/storage.ts` returns placeholder image URLs from `placehold.co` instead of really uploading anywhere. Wiring up real storage (Cloudflare R2, S3, Vercel Blob) is a one-file change but was out of scope for the capstone.
- Content types are hardcoded to `posts` and `pages`. There is no schema editor.
- `listConnectedRepos` returns the first 50 repos from Octokit's first page; pagination is not implemented.

## Tech stack

Next.js 16 (App Router) for the GitCMS app itself, React 19, TypeScript, Tailwind CSS v4, NextAuth.js for the GitHub OAuth flow, Octokit for everything GitHub-API related, TipTap for the rich-text editor, and `@webcontainer/api` for the in-browser dev server that drives the live preview.
