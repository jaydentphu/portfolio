import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.string(),
    period: z.string(),
    order: z.number(),
    tags: z.array(z.string()),
    builtWith: z.array(
      z.object({
        name: z.string(),
        note: z.string(),
      })
    ),
    repo: z.string().optional(),
    demo: z.string().optional(),
  }),
});

export const collections = { projects };
