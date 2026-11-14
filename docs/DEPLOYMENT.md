# Deployment

StagePlot Studio builds to static files. There is no server, database, or environment variable required in production.

## Prerequisites

- Node.js 22 or newer (CI uses 22).
- npm 10 or newer.
- A GitHub repository containing the project.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build and local check:

```bash
npm run build
npm run preview    # serves dist/ locally
npm run lint       # tsc --noEmit
```

`dist/` is git-ignored and is produced fresh by CI.

## GitHub Pages (configured)

The repository includes [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml). It runs on every push to `main` and on manual dispatch.

### One-time repository setup

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Push to `main`, or open **Actions → Deploy to GitHub Pages → Run workflow**.

The workflow:

1. checks out the repository,
2. installs Node 22 with npm caching,
3. runs `npm ci`,
4. runs `npm run build`,
5. uploads `dist/` as a Pages artifact,
6. deploys it with the official Pages actions.

The site URL is:

```text
https://<owner>.github.io/<repo>/
```

For this repository: <https://rayfoolshs.github.io/StageplotPro/>

### Why the build works under a sub-path

`vite.config.ts` sets `base: './'`. All asset URLs are relative, so the same build works:

- at a user/org root (`https://owner.github.io/`),
- under a project path (`https://owner.github.io/StageplotPro/`),
- on a custom domain (`https://stageplot.example.com/`).

If you later add client-side routing, switch to an absolute `base` and add a SPA fallback (`404.html`), because Pages serves 404s for unknown paths. The current app has no router.

## Custom domain

1. Add a `public/CNAME` file containing the bare domain, for example:

   ```text
   stageplot.example.com
   ```

2. In **Settings → Pages → Custom domain**, enter the same domain and save.
3. Create the DNS records GitHub requests (usually a `CNAME` to `<owner>.github.io` for subdomains).
4. Enable **Enforce HTTPS** once the certificate is issued.

Vite copies `public/` into `dist/`, so no workflow change is needed.

## Other static hosts

The build output is host-agnostic. Any of these work with the settings below:

| Host | Build command | Output |
| --- | --- | --- |
| Netlify | `npm run build` | `dist` |
| Vercel | `npm run build` | `dist` |
| Cloudflare Pages | `npm run build` | `dist` |
| S3 / CloudFront / nginx | `npm run build` | upload `dist/` |

No rewrite rules are needed while the app remains a single page.

## CI notes

- `npm ci` requires `package-lock.json`, which is committed. Regenerate it with `npm install` after changing dependencies.
- The workflow needs `pages: write` and `id-token: write`; these are declared in the workflow file.
- Deployment uses the `github-pages` environment. If the repository requires approvals for that environment, a deploy may wait for review.
- The build does not run `npm run lint` in CI. Run it locally (or add a step) if you want type errors to block deployment.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Blank page, 404s for `/assets/...` | Absolute base path against a sub-path deployment | Keep `base: './'` (or set the correct `base`). |
| Workflow fails at `npm ci` | Lock file out of sync with `package.json` | Run `npm install`, commit `package-lock.json`. |
| Workflow fails at build | Peer dependency conflict | Reproduce locally with `npm ci && npm run build`; adjust versions rather than forcing installs. |
| Pages shows the README instead of the app | Source set to "Deploy from a branch" | Set **Source** to **GitHub Actions**. |
| Deploy job skipped | Pages not enabled, or environment protection | Enable Pages; approve the environment deployment. |
| Old version still served | CDN cache or deployment still running | Check the Actions run, then hard-refresh. |

## Rolling back

Pages deployments are immutable. To roll back, revert the offending commit on `main` and let the workflow redeploy, or re-run an earlier successful workflow run from the Actions tab.
