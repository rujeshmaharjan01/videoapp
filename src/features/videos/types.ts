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
  thumbnailUrl: string | null;
  folderId: string | null;
  status: VideoStatus;
  visibility: VideoVisibility;
  createdAt: string;
  updatedAt: string | null;
};

export type VideoFolder = {
  id: string;
  name: string;
};
