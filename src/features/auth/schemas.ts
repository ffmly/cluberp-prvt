import { z } from "zod";

const emailSchema = z
  .email("Enter a valid email address.")
  .trim()
  .toLowerCase();

const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128, "Password is too long.");

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = signInSchema.extend({
  displayName: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(120, "Name is too long."),
});
