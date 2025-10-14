import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email format');

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  per_page: z.number().int().positive().max(100).default(20),
});

export const postCreateSchema = z.object({
  space_id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  body: z.string().min(1),
  status: z.enum(['draft', 'published']).default('published'),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  headline: z.string().max(100).optional(),
});

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}