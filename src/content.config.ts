import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tag: z.string(),            // medium label, e.g. "Costume design"
      role: z.string(),
      where: z.string(),
      year: z.string(),
      note: z.string(),
      from: z.string().optional(),        // the "this came from a series" line
      photoCredit: z.string().optional(),
      order: z.number(),
      cover: image(),
      gallery: z.array(image()).default([]),
    }),
});

export const collections = { works };
