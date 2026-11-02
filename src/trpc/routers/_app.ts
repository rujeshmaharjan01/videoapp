import { videosRouter } from "@/features/videos/server/routers";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  videos: videosRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
