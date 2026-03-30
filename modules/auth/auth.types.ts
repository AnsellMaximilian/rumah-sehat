import { z } from "zod";
import { SignInSchema, SignUpSchema } from "@/modules/auth/auth.schemas";

export type TreeifiedFieldErrors<T> = {
  [K in keyof T]?: {
    errors: string[];
  };
};

export type SignInInput = z.infer<typeof SignInSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;

export type SignInServiceInput = Omit<SignInInput, "callbackURL"> & {
  callbackURL?: string;
};

export type SignUpServiceInput = Omit<SignUpInput, "confirmPassword">;

export type AuthSession = {
  session: {
    id: string;
    expiresAt: Date;
    userId: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
  };
};
