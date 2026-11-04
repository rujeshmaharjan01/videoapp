import "server-only";

const BASE_URL = "https://api.streamtape.com";

type StreamTapeResponse<T> = {
  status: number;
  msg: string;
  result: T;
};

export type StreamTapeFile = {
  name: string;
  size: number;
  link: string;
  created_at: number;
  downloads: number;
  linkid: string;
  convert: string;
};

export type StreamTapeFolder = {
  id: string;
  name: string;
};

export type StreamTapeFolderContents = {
  folders: StreamTapeFolder[];
  files: StreamTapeFile[];
};

export type StreamTapeFileInfo = {
  id: string;
  name: string;
  size: number;
  type: string;
  converted: boolean;
  status: number;
};

export type StreamTapeUploadUrl = {
  url: string;
  valid_until: string;
};

export class StreamTapeError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "StreamTapeError";
    this.status = status;
  }
}

function getCredentials() {
  const login = process.env.STREAMTAPE_LOGIN;
  const key = process.env.STREAMTAPE_KEY;

  if (!login || !key) {
    throw new StreamTapeError(
      "StreamTape credentials are not configured. Set STREAMTAPE_LOGIN and STREAMTAPE_KEY.",
      500,
    );
  }

  return { login, key };
}

const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

let requestQueue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

/**
 * StreamTape is strict about request bursts. Serialize calls and leave at
 * least one second between them.
 */
function schedule<T>(task: () => Promise<T>) {
  const result = requestQueue.then(async () => {
    const wait = Math.max(0, 1000 - (Date.now() - lastRequestAt));

    if (wait > 0) {
      await sleep(wait);
    }

    lastRequestAt = Date.now();
    return task();
  });

  requestQueue = result.then(
    () => undefined,
    () => undefined,
  );

  return result;
}

const responseCache = new Map<
  string,
  { expiresAt: number; value: Promise<unknown> }
>();

function cached<T>(key: string, ttl: number, load: () => Promise<T>) {
  const entry = responseCache.get(key);

  if (entry && entry.expiresAt > Date.now()) {
    return entry.value as Promise<T>;
  }

  const value = load();
  responseCache.set(key, { expiresAt: Date.now() + ttl, value });

  value.catch(() => {
    responseCache.delete(key);
  });

  return value;
}

function clearStreamTapeCache() {
  responseCache.clear();
}

/**
 * Run a mutating StreamTape call and drop cached folder/account data so the
 * next read reflects the change immediately.
 */
async function mutate<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const result = await request<T>(path, params);
  clearStreamTapeCache();
  return result;
}

async function request<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const { login, key } = getCredentials();

  const send = async () => {
    const url = new URL(path, BASE_URL);

    url.searchParams.set("login", login);
    url.searchParams.set("key", key);

    for (const [name, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(name, String(value));
      }
    }

    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new StreamTapeError(
        `StreamTape request failed with HTTP ${response.status}.`,
        response.status,
      );
    }

    return (await response.json()) as StreamTapeResponse<T>;
  };

  let payload = await schedule(send);

  if (payload.status === 509) {
    await sleep(2500);
    payload = await schedule(send);
  }

  if (payload.status !== 200) {
    throw new StreamTapeError(
      payload.msg || "StreamTape request failed.",
      payload.status,
    );
  }

  return payload.result;
}

export function listFolder(folder?: string, options?: { fresh?: boolean }) {
  if (options?.fresh) {
    clearStreamTapeCache();
  }

  return cached(`folder:${folder ?? "root"}`, 60_000, () =>
    request<StreamTapeFolderContents>("/file/listfolder", { folder }),
  );
}

/**
 * The configured value can be either a real folder ID or a folder name.
 * Resolve names against the account root so `onevideo` also works.
 */
export async function resolveFolderId(
  configured = process.env.STREAMTAPE_FOLDER_ID,
) {
  if (!configured) {
    return undefined;
  }

  try {
    const root = await listFolder();
    const match = root.folders.find(
      (folder) => folder.id === configured || folder.name === configured,
    );

    return match?.id ?? configured;
  } catch {
    return configured;
  }
}

export function createUploadUrl(options: {
  folder?: string;
  sha256?: string;
  httponly?: boolean;
}) {
  return request<StreamTapeUploadUrl>("/file/ul", {
    folder: options.folder,
    sha256: options.sha256,
    httponly: options.httponly ? "true" : undefined,
  });
}

export function getFileInfo(fileIds: string | string[]) {
  const file = Array.isArray(fileIds) ? fileIds.join(",") : fileIds;
  return request<Record<string, StreamTapeFileInfo>>("/file/info", { file });
}

export function moveFile(file: string, folder: string) {
  return mutate<boolean>("/file/move", { file, folder });
}

export function deleteFile(file: string) {
  return mutate<boolean>("/file/delete", { file });
}

export function addRemoteUpload(options: {
  url: string;
  folder?: string;
  headers?: string;
  name?: string;
}) {
  return mutate<{ id: string; folderid: string }>("/remotedl/add", {
    url: options.url,
    folder: options.folder,
    headers: options.headers,
    name: options.name,
  });
}
