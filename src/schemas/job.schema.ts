import { z } from 'zod';

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    company: z.string().min(1),
    imageUrl: z.string().url().nullish(),
    jobUrl: z.string().url(),
  }),
});

export const updateJobSchema = z.object({
  body: createJobSchema.shape.body.partial(),
});
