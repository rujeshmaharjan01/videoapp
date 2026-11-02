import { PAGINATION } from "@/config/constants";
import { parseAsInteger, parseAsString } from "nuqs/server";

export const videosParams = {
  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),
  search: parseAsString
    .withDefault("")
    .withOptions({ clearOnDefault: true }),
  folderId: parseAsString
    .withDefault("")
    .withOptions({ clearOnDefault: true }),
};

export type VideosParams = {
  page: number;
  pageSize: number;
  search: string;
  folderId: string;
};

/**
 * An empty folderId means "the configured StreamTape folder"; the special
 * "root" value means the account root.
 */
export function toVideosQueryInput(params: VideosParams) {
  return {
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    folderId: params.folderId === "root" ? "" : params.folderId || undefined,
  };
}
