import "dotenv/config";

import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";

import { prisma } from "../src/lib/prisma";

async function main() {
  const name = process.env.ADMIN_NAME?.trim() || "VideoApp Admin";
  const email =
    process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@videoapp.local";
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD is not set. Add it to .env before seeding the admin.",
    );
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters long.");
  }

  const passwordHash = await hashPassword(password);

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (existing) {
    const credentialAccount = existing.accounts.find(
      (account) => account.providerId === "credential",
    );

    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        emailVerified: true,
        ...(credentialAccount
          ? {
              accounts: {
                update: {
                  where: { id: credentialAccount.id },
                  data: { password: passwordHash },
                },
              },
            }
          : {
              accounts: {
                create: {
                  id: randomUUID(),
                  accountId: existing.id,
                  providerId: "credential",
                  password: passwordHash,
                },
              },
            }),
      },
    });

    console.log(`Updated admin account: ${email}`);
    return;
  }

  const userId = randomUUID();

  await prisma.user.create({
    data: {
      id: userId,
      name,
      email,
      emailVerified: true,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          password: passwordHash,
        },
      },
    },
  });

  console.log(`Created admin account: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
