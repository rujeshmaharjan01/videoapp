import { auth, isAdminEmail } from "@/lib/auth";
import { StreamTapeError } from "@/lib/streamtape";
import { initTRPC, TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { cache } from "react";

export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return {};
});

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  // transformer: superjson,
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;

const mapStreamTapeErrors = t.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof StreamTapeError) {
      const code =
        error.status === 404
          ? "NOT_FOUND"
          : error.status === 403
            ? "FORBIDDEN"
            : error.status === 451
              ? "FORBIDDEN"
              : error.status >= 500
                ? "INTERNAL_SERVER_ERROR"
                : "BAD_REQUEST";

      throw new TRPCError({ code, message: error.message, cause: error });
    }

    throw error;
  }
});

export const publicProcedure = baseProcedure.use(mapStreamTapeErrors);

export const protectedProcedure = publicProcedure.use(
  async ({ ctx, next }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    if (!isAdminEmail(session.user.email)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required.",
      });
    }

    return next({ ctx: { ...ctx, auth: session } });
  },
);
