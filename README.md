# jayden.dev() — personal portfolio

Dark-mode, developer-aesthetic portfolio site. Original design; built with
[Astro](https://astro.build) so case studies are plain Markdown and every page
shares one layout.

## Commands

| Command           | Action                                    |
| ----------------- | ----------------------------------------- |
| `npm install`     | Install dependencies                      |
| `npm run dev`     | Dev server at `localhost:4321`            |
| `npm run build`   | Production build to `./dist/`             |
| `npm run preview` | Preview the production build locally      |

## Structure

```
src/
  consts.ts               site-wide constants (name, email, social links)
  content.config.ts       schema for the projects collection
  content/projects/       case studies — one Markdown file each
  layouts/Base.astro      shared shell: head/SEO, nav, footer, custom cursor
  components/             ProjectCard
  pages/                  index, about, 404, projects/[slug]
  styles/global.css       the whole design system
public/
  resume.pdf              served at /resume.pdf (stable path)
  favicon.svg
```

To add a case study, drop a new `.md` file in `src/content/projects/` with the
same frontmatter shape as the existing ones — it gets a card on the home page
and its own page automatically.

## Before launch (TODOs)

- [ ] Replace `CHANGEME` GitHub/LinkedIn URLs in `src/consts.ts`
- [ ] Add real repo/demo links to case study frontmatter
- [ ] Review the TODO comments inside both case studies (verify claims, MDBL sign-off)
- [ ] Set the real domain in `astro.config.mjs`
- [ ] Social share image (`og:image`) — currently text-only previews
