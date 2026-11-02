import "server-only"; // <-- ensure this file cannot be imported from the client
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

export function prefetch(queryOptions: { queryKey: readonly unknown[] }) {
  const queryClient = getQueryClient();
  const queryKey = queryOptions.queryKey;
  const queryType = queryKey?.[1];
  const isInfinite =
    typeof queryType === "object" &&
    queryType !== null &&
    "type" in queryType &&
    (queryType as { type?: string }).type === "infinite";

  if (isInfinite) {
    return queryClient.prefetchInfiniteQuery(
      queryOptions as Parameters<typeof queryClient.prefetchInfiniteQuery>[0],
    );
  }

  return queryClient.prefetchQuery(
    queryOptions as Parameters<typeof queryClient.prefetchQuery>[0],
  );
}

export async function getCaller() {
  return appRouter.createCaller(await createTRPCContext());
}
