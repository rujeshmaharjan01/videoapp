export type VideoStatus = "PROCESSING" | "READY" | "FAILED";
export type VideoVisibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

export type VideoItem = {
  id: string;
  dbId: string | null;
  title: string;
  description: string | null;
  tags: string[];
  fileName: string;
  size: number;
  link: string;
  embedUrl: string;
  downloadUrl: string | null;
  thumbnailUrl: string | null;
  folderId: string | null;
  status: VideoStatus;
  visibility: VideoVisibility;
  downloads: number;
  createdAt: string;
  updatedAt: string | null;
};

export type VideoFolder = {
  id: string;
  name: string;
};

export type VideoListResult = {
  items: VideoItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
