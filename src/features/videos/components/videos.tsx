"use client";

import {
  EmptyView,
  EntityContainer,
  EntityHeader,
  EntityItem,
  EntityList,
  EntityPagination,
  EntitySearch,
  ErrorView,
  LoadingView,
} from "@/components/entity-components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { useEntitySearch } from "@/hooks/use-entity-search";
import { formatBytes } from "@/lib/format";
import { toast } from "@/lib/toast";
import { formatDistanceToNow } from "date-fns";
import {
  CloudDownloadIcon,
  CopyIcon,
  FilmIcon,
  FolderInputIcon,
  LinkIcon,
  PencilIcon,
  RefreshCwIcon,
  UploadIcon,
  VideoIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  useMoveVideo,
  useRemoteUpload,
  useRemoveVideo,
  useSuspenseVideos,
  useSyncVideos,
  useUpdateVideo,
  useVideoFolders,
  useVideoStats,
} from "../hooks/use-videos";
import { useVideosParams } from "../hooks/use-videos-params";
import { useUploadVideo } from "../hooks/use-upload-video";
import { toVideosQueryInput } from "../params";
import type { VideoFolder, VideoItem, VideoVisibility } from "../types";

export const VideosFolderFilter = () => {
  const [params, setParams] = useVideosParams();
  const folders = useVideoFolders();

  return (
    <NativeSelect
      aria-label="Filter by folder"
      className="w-[200px]"
      value={params.folderId}
      onChange={(event) =>
        setParams({
          ...params,
          folderId: event.target.value,
          page: 1,
        })
      }
    >
      <NativeSelectOption value="">Default folder</NativeSelectOption>
      <NativeSelectOption value="root">Account root</NativeSelectOption>
      {folders.data?.map((folder) => (
        <NativeSelectOption key={folder.id} value={folder.id}>
          {folder.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
};

export const VideosSearch = () => {
  const [params, setParams] = useVideosParams();
  const { searchValue, onSearchChange } = useEntitySearch({
    params,
    setParams,
  });

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <VideosFolderFilter />
      <EntitySearch
        value={searchValue}
        onChange={onSearchChange}
        placeholder="Search videos"
      />
    </div>
  );
};

export const VideosList = () => {
  const videos = useSuspenseVideos();

  return (
    <EntityList
      items={videos.data.items}
      getKey={(video) => video.id}
      renderItem={(video) => <VideoListItem video={video} />}
      emptyView={<VideosEmpty />}
    />
  );
};

export const VideosHeader = ({ disabled }: { disabled?: boolean }) => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [remoteOpen, setRemoteOpen] = useState(false);
  const [params] = useVideosParams();
  const syncVideos = useSyncVideos();
  const syncTarget = toVideosQueryInput(params).folderId;

  return (
    <>
      <EntityHeader
        title="Videos"
        description="Upload, manage, and share videos hosted on StreamTape"
        onNew={() => setUploadOpen(true)}
        newButtonLabel="Upload video"
        disabled={disabled}
        secondaryAction={
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled || syncVideos.isPending}
              onClick={() => syncVideos.mutate({ folderId: syncTarget })}
            >
              <RefreshCwIcon
                className={`size-4 ${syncVideos.isPending ? "animate-spin" : ""}`}
              />
              {syncVideos.isPending ? "Syncing..." : "Sync"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => setRemoteOpen(true)}
            >
              <LinkIcon className="size-4" />
              Remote URL
            </Button>
          </>
        }
      />
      <UploadVideoDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <RemoteUploadDialog open={remoteOpen} onOpenChange={setRemoteOpen} />
    </>
  );
};

export const VideosPagination = () => {
  const videos = useSuspenseVideos();
  const [params, setParams] = useVideosParams();

  return (
    <EntityPagination
      disabled={videos.isFetching}
      totalPages={videos.data.totalPages}
      page={videos.data.page}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

export const VideosContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <EntityContainer
      header={
        <>
          <VideosHeader />
          <VideosStats />
        </>
      }
      search={<VideosSearch />}
      pagination={<VideosPagination />}
    >
      {children}
    </EntityContainer>
  );
};

export const VideosStats = () => {
  const stats = useVideoStats();

  if (!stats.data) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border bg-background p-3">
        <p className="text-xs text-muted-foreground">Videos</p>
        <p className="text-lg font-semibold">{stats.data.totalFiles}</p>
      </div>
      <div className="rounded-lg border bg-background p-3">
        <p className="text-xs text-muted-foreground">Storage used</p>
        <p className="text-lg font-semibold">
          {formatBytes(stats.data.totalBytes)}
        </p>
      </div>
      <div className="rounded-lg border bg-background p-3">
        <p className="text-xs text-muted-foreground">Folders used</p>
        <p className="text-lg font-semibold">{stats.data.folderCount}</p>
      </div>
    </div>
  );
};

export const VideosLoading = () => {
  return <LoadingView message="Loading videos..." />;
};

export const VideosError = () => {
  return <ErrorView message="Could not load your video library" />;
};

export const VideosEmpty = () => {
  return (
    <EmptyView message="No videos in this folder yet. Use the Upload video button to add one." />
  );
};

function VideoListItem({ video }: { video: VideoItem }) {
  const router = useRouter();
  const removeVideo = useRemoveVideo();
  const [renameOpen, setRenameOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [visibility, setVisibility] = useState<VideoVisibility>(
    video.visibility,
  );
  const updateVideo = useUpdateVideo();

  const copyLink = async () => {
    const url = `${window.location.origin}/watch/${video.id}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied", url);
  };

  return (
    <>
      <EntityItem
        href={`/watch/${video.id}`}
        title={video.title}
        subtitle={
          <>
            {video.fileName} &bull; {formatBytes(video.size)} &bull; Added{" "}
            {formatDistanceToNow(new Date(video.createdAt), {
              addSuffix: true,
            })}
          </>
        }
        image={
          <div className="flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
            {video.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={video.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <FilmIcon className="size-6 text-muted-foreground" />
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-1">
            <Badge variant={video.status === "READY" ? "secondary" : "outline"}>
              {video.status === "READY"
                ? "Ready"
                : video.status === "FAILED"
                  ? "Failed"
                  : "Processing"}
            </Badge>
            <Button
              size="icon-sm"
              variant="ghost"
              title="Copy watch link"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void copyLink();
              }}
            >
              <CopyIcon className="size-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              title="Move video"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMoveOpen(true);
              }}
            >
              <FolderInputIcon className="size-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              title="Rename video"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setTitle(video.title);
                setVisibility(video.visibility);
                setRenameOpen(true);
              }}
            >
              <PencilIcon className="size-4" />
            </Button>
          </div>
        }
        onRemove={() => {
          removeVideo.mutate(
            { id: video.id },
            {
              onSuccess: () => {
                router.refresh();
              },
            },
          );
        }}
        isRemoving={removeVideo.isPending}
      />

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit video</DialogTitle>
            <DialogDescription>
              Change the title and who can open the public watch page.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`title-${video.id}`}>Title</Label>
              <Input
                id={`title-${video.id}`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Video title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`visibility-${video.id}`}>Visibility</Label>
              <NativeSelect
                id={`visibility-${video.id}`}
                className="w-full"
                value={visibility}
                onChange={(event) =>
                  setVisibility(event.target.value as VideoVisibility)
                }
              >
                <NativeSelectOption value="UNLISTED">
                  Unlisted - anyone with the link
                </NativeSelectOption>
                <NativeSelectOption value="PUBLIC">
                  Public - anyone can watch
                </NativeSelectOption>
                <NativeSelectOption value="PRIVATE">
                  Private - only you
                </NativeSelectOption>
              </NativeSelect>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!title.trim() || updateVideo.isPending}
              onClick={() => {
                updateVideo.mutate(
                  { id: video.id, title: title.trim(), visibility },
                  {
                    onSuccess: () => {
                      setRenameOpen(false);
                      router.refresh();
                    },
                  },
                );
              }}
            >
              {updateVideo.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MoveVideoDialog
        video={video}
        open={moveOpen}
        onOpenChange={setMoveOpen}
      />
    </>
  );
}

function FolderSelect({
  id,
  value,
  onChange,
  disabled,
  folders,
  includeDefault = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  folders: VideoFolder[] | undefined;
  includeDefault?: boolean;
}) {
  return (
    <NativeSelect
      id={id}
      className="w-full"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      {includeDefault && (
        <NativeSelectOption value="">Default folder</NativeSelectOption>
      )}
      {folders?.map((folder) => (
        <NativeSelectOption key={folder.id} value={folder.id}>
          {folder.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

function MoveVideoDialog({
  video,
  open,
  onOpenChange,
}: {
  video: VideoItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const folders = useVideoFolders();
  const moveVideo = useMoveVideo();
  const [folderId, setFolderId] = useState(video.folderId ?? "");

  const targets = (folders.data ?? []).filter(
    (folder) => folder.id !== video.folderId,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setFolderId(targets[0]?.id ?? "");
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move video</DialogTitle>
          <DialogDescription>
            Move {video.title} to another StreamTape folder.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor={`move-folder-${video.id}`}>Destination</Label>
          <NativeSelect
            id={`move-folder-${video.id}`}
            className="w-full"
            value={folderId}
            disabled={moveVideo.isPending}
            onChange={(event) => setFolderId(event.target.value)}
          >
            {targets.length === 0 && (
              <NativeSelectOption value="">
                No other folders available
              </NativeSelectOption>
            )}
            {targets.map((folder) => (
              <NativeSelectOption key={folder.id} value={folder.id}>
                {folder.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              !folderId ||
              folderId === video.folderId ||
              moveVideo.isPending ||
              targets.length === 0
            }
            onClick={() => {
              moveVideo.mutate(
                { id: video.id, folderId },
                {
                  onSuccess: () => {
                    onOpenChange(false);
                    router.refresh();
                  },
                },
              );
            }}
          >
            {moveVideo.isPending ? "Moving..." : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadVideoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [folderId, setFolderId] = useState("");
  const folders = useVideoFolders();
  const { upload, progress, isUploading } = useUploadVideo();

  const reset = () => {
    setFile(null);
    setTitle("");
    setTags("");
    setFolderId("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Choose a video file first");
      return;
    }

    try {
      await upload(file, {
        title: title.trim() || undefined,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        folderId: folderId || undefined,
        onSuccess: () => {
          onOpenChange(false);
          reset();
          router.refresh();
        },
      });
    } catch {
      // The upload hook already shows a toast.
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isUploading) {
          onOpenChange(nextOpen);
          if (!nextOpen) {
            reset();
          }
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadIcon className="size-4" />
            Upload video
          </DialogTitle>
          <DialogDescription>
            The file uploads directly from your browser to StreamTape. Your API
            credentials stay on the server.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="video-file">Video file</Label>
            <Input
              ref={inputRef}
              id="video-file"
              type="file"
              accept="video/*"
              disabled={isUploading}
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
                if (nextFile && !title) {
                  setTitle(nextFile.name.replace(/\.[^/.]+$/, ""));
                }
              }}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} &bull; {formatBytes(file.size)}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="video-title">Title</Label>
            <Input
              id="video-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional title"
              disabled={isUploading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="video-tags">Tags</Label>
            <Input
              id="video-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="Comma-separated, e.g. tutorial, react"
              disabled={isUploading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="video-folder">Folder</Label>
            <FolderSelect
              id="video-folder"
              value={folderId}
              onChange={setFolderId}
              disabled={isUploading}
              folders={folders.data}
              includeDefault
            />
          </div>

          {isUploading && (
            <div className="grid gap-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isUploading}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={!file || isUploading}
            onClick={() => void handleUpload()}
          >
            {isUploading ? `Uploading ${progress}%` : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemoteUploadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState("");
  const folders = useVideoFolders();
  const remoteUpload = useRemoteUpload();

  const reset = () => {
    setUrl("");
    setName("");
    setFolderId("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!remoteUpload.isPending) {
          onOpenChange(nextOpen);
          if (!nextOpen) {
            reset();
          }
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudDownloadIcon className="size-4" />
            Remote upload
          </DialogTitle>
          <DialogDescription>
            Ask StreamTape to download a video from a direct URL. The transfer
            runs in the background after it starts.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="remote-url">Video URL</Label>
            <Input
              id="remote-url"
              type="url"
              placeholder="https://example.com/video.mp4"
              value={url}
              disabled={remoteUpload.isPending}
              onChange={(event) => setUrl(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="remote-name">File name</Label>
            <Input
              id="remote-name"
              placeholder="Optional, e.g. trailer.mp4"
              value={name}
              disabled={remoteUpload.isPending}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="remote-folder">Folder</Label>
            <FolderSelect
              id="remote-folder"
              value={folderId}
              onChange={setFolderId}
              disabled={remoteUpload.isPending}
              folders={folders.data}
              includeDefault
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={remoteUpload.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={!url.trim() || remoteUpload.isPending}
            onClick={() => {
              remoteUpload.mutate(
                {
                  url: url.trim(),
                  name: name.trim() || undefined,
                  folderId: folderId || undefined,
                },
                {
                  onSuccess: () => {
                    onOpenChange(false);
                    reset();
                    router.refresh();
                  },
                },
              );
            }}
          >
            {remoteUpload.isPending ? "Starting..." : "Start upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VideoPlaceholder() {
  return (
    <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted">
      <VideoIcon className="size-10 text-muted-foreground" />
    </div>
  );
}
