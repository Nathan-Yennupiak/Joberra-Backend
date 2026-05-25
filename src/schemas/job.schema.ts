import { z } from 'zod';

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    company: z.string().min(2),
    category: z.string().min(2),
    location: z.string().min(2),
    jobType: z.string().min(2),
    imageUrl: z.string().url().optional().or(z.literal('')),
    jobUrl: z.string().url(),
  }),
});

export const updateJobSchema = z.object({
  body: createJobSchema.shape.body.partial(),
});
