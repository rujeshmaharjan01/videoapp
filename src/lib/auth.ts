import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/prisma";

const adminEmail = (
  process.env.ADMIN_EMAIL?.trim() || "admin@videoapp.local"
).toLowerCase();

export const isAdminEmail = (email?: string | null) =>
  !!email && email.trim().toLowerCase() === adminEmail;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    // Public registration is disabled. The only account is the seeded admin.
    disableSignUp: true,
  },
  plugins: [nextCookies()],
});
