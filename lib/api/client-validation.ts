import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(6),
  })
  .superRefine((value, ctx) => {
    if (value.confirmPassword !== value.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export type SignupInput = z.infer<typeof signupSchema>;

