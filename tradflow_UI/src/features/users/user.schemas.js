import { z } from "zod";

const email = z.string().email("Email must be valid");

export const createUserSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(100),
  email,
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().trim().min(1, "Full name is required").max(150),
  phone:    z.string().optional(),
  active:   z.boolean(),
  roleId:   z.string().min(1, "Role is required"),
});

export const updateUserSchema = z.object({
  email,
  fullName:      z.string().trim().min(1, "Full name is required").max(150),
  phone:         z.string().optional(),
  active:        z.boolean(),
  accountLocked: z.boolean(),
  roleId:        z.string().min(1, "Role is required"),
});