import {
  VideosContainer,
  VideosError,
  VideosList,
  VideosLoading,
} from "@/features/videos/components/videos";
import { toVideosQueryInput } from "@/features/videos/params";
import { videosParamsLoader } from "@/features/videos/server/params-loader";
import {
  prefetchVideoFolders,
  prefetchVideoStats,
  prefetchVideos,
} from "@/features/videos/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

type Props = {
  searchParams: Promise<SearchParams>;
};

const Page = async ({ searchParams }: Props) => {
  await requireAuth();

  const params = await videosParamsLoader(searchParams);
  await Promise.all([
    prefetchVideos(toVideosQueryInput(params)),
    prefetchVideoStats(),
    prefetchVideoFolders(),
  ]);

  return (
    <VideosContainer>
      <HydrateClient>
        <ErrorBoundary fallback={<VideosError />}>
          <Suspense fallback={<VideosLoading />}>
            <VideosList />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </VideosContainer>
  );
};

export default Page;
