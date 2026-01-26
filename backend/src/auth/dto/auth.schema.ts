import { z } from 'zod';

export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8)
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      'Password must have uppercase, lowercase, and number',
    ),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = signUpSchema;
export type SignInInput = z.infer<typeof signInSchema>;
