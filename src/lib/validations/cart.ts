import * as z from 'zod';

export const cartItemSchema = z.object({
  serviceId: z.number(),
  quantity: z.number().min(0),
});
