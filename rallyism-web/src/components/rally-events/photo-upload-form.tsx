"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import type {
  CreateDirectPhotoUploadPlanActionResult,
  FinalizeDirectPhotoUploadActionResult,
} from "@/app/rally-events/[id]/albums/[albumId]/photos/upload/actions";
import type {
  DirectPhotoUploadPlan,
  DirectPhotoUploadTarget,
  FinalizeDirectPhotoUploadInput,
  PhotoUploadResult,
} from "@/services/photo-uploads";

type PhotoUploadFormProps = {
  albumId: number;
  cancelHref: string;
  createUploadPlanAction: (input: {
    rallyEventId: number;
    albumId: number;
    files: { name: string; size: number; type: string }[];
  }) => Promise<CreateDirectPhotoUploadPlanActionResult>;
  finalizeUploadAction: (
    values: FinalizeDirectPhotoUploadInput,
  ) => Promise<FinalizeDirectPhotoUploadActionResult>;
  rallyEventId: number;
};

type UploadProgressItem = {
  filename: string;
  status: "waiting" | "processing" | "uploading" | "saved" | "failed";
  message: string;
};

type ProcessedPhoto = {
  display: {
    blob: Blob;
    width: number;
    height: number;
  };
  thumbnail: {
    blob: Blob;
  };
};

const displayMaxWidth = 2000;
const thumbnailMaxWidth = 480;

function getFilename(file: File) {
  return file.name.trim() || "photo";
}

function getImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("This photo could not be opened."));
    };
    image.src = objectUrl;
  });
}

function canvasToWebpBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("This browser could not create a WebP image."));
          return;
        }

        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

async function resizeToWebp(
  file: File,
  maxWidth: number,
  quality: number,
) {
  const image = await getImageFromFile(file);
  const scale = Math.min(1, maxWidth / image.naturalWidth);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("This browser could not process the photo.");
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  return {
    blob: await canvasToWebpBlob(canvas, quality),
    width,
    height,
  };
}

async function processPhoto(file: File): Promise<ProcessedPhoto> {
  const [display, thumbnail] = await Promise.all([
    resizeToWebp(file, displayMaxWidth, 0.85),
    resizeToWebp(file, thumbnailMaxWidth, 0.8),
  ]);

  return {
    display,
    thumbnail,
  };
}

async function uploadObject(target: DirectPhotoUploadTarget["display"], blob: Blob) {
  const response = await fetch(target.uploadUrl, {
    method: "PUT",
    headers: target.headers,
    body: blob,
  });

  if (!response.ok) {
    throw new Error(`Storage upload failed with status ${response.status}.`);
  }
}

function getAlbumResultHref(input: {
  rallyEventId: number;
  albumId: number;
  result: PhotoUploadResult;
  warnings: DirectPhotoUploadPlan["warnings"];
}) {
  const params = new URLSearchParams({
    filter: "photos",
    uploadStatus: input.result.status,
    uploaded: String(input.result.uploaded.length),
    failed: String(input.result.failed.length),
  });

  if (input.result.failed.length > 0) {
    params.set("uploadFailedDetails", JSON.stringify(input.result.failed));
  }

  if (input.warnings.length > 0) {
    params.set("uploadWarnings", JSON.stringify(input.warnings));
  }

  return `/rally-events/${input.rallyEventId}/albums/${input.albumId}?${params.toString()}`;
}

export function PhotoUploadForm({
  albumId,
  cancelHref,
  createUploadPlanAction,
  finalizeUploadAction,
  rallyEventId,
}: PhotoUploadFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<UploadProgressItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const uploading = isPending || progress.some((item) =>
    ["processing", "uploading"].includes(item.status),
  );

  function updateProgress(index: number, values: Partial<UploadProgressItem>) {
    setProgress((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...values } : item,
      ),
    );
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? []);

    setFiles(nextFiles);
    setError(null);
    setProgress(
      nextFiles.map((file) => ({
        filename: getFilename(file),
        status: "waiting",
        message: "Ready",
      })),
    );
  }

  async function runUpload() {
    if (files.length === 0) {
      setError("Choose at least one photo to upload.");
      return;
    }

    setError(null);
    const planResult = await createUploadPlanAction({
      rallyEventId,
      albumId,
      files: files.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    });

    if (planResult.status === "error") {
      setError(planResult.error);
      return;
    }

    const uploaded: FinalizeDirectPhotoUploadInput["uploaded"] = [];
    const failed: FinalizeDirectPhotoUploadInput["failed"] = [];

    for (const [index, target] of planResult.plan.targets.entries()) {
      const file = files[index];
      const filename = getFilename(file);

      try {
        updateProgress(index, {
          status: "processing",
          message: "Preparing WebP versions",
        });
        const processed = await processPhoto(file);

        updateProgress(index, {
          status: "uploading",
          message: "Uploading to storage",
        });
        await Promise.all([
          uploadObject(target.display, processed.display.blob),
          uploadObject(target.thumbnail, processed.thumbnail.blob),
        ]);

        uploaded.push({
          filename,
          displayImageR2Key: target.display.key,
          thumbnailImageR2Key: target.thumbnail.key,
          fileSizeBytes: processed.display.blob.size,
          width: processed.display.width,
          height: processed.display.height,
        });
        updateProgress(index, {
          status: "saved",
          message: "Uploaded",
        });
      } catch (uploadError) {
        const message =
          uploadError instanceof Error
            ? uploadError.message
            : "This photo could not be uploaded.";

        failed.push({ filename, error: message });
        updateProgress(index, {
          status: "failed",
          message,
        });
      }
    }

    const finalizeResult = await finalizeUploadAction({
      rallyEventId,
      albumId,
      batchId: planResult.plan.batchId,
      uploaded,
      failed,
    });

    if (finalizeResult.status === "error") {
      setError(finalizeResult.error);
      return;
    }

    window.location.assign(
      getAlbumResultHref({
        rallyEventId,
        albumId,
        result: finalizeResult.result,
        warnings: planResult.plan.warnings,
      }),
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (uploading) {
      return;
    }

    startTransition(() => {
      void runUpload();
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          htmlFor="photos"
          className="block text-sm font-semibold text-zinc-950"
        >
          Photo files
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          disabled={uploading}
          onChange={handleFileChange}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm file:mr-4 file:rounded-md file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-900 hover:file:bg-zinc-200 focus:border-rally-blue focus:outline-none focus:ring-2 focus:ring-rally-blue-soft disabled:cursor-wait disabled:opacity-70"
        />
        {files.length > 0 && (
          <p className="text-sm font-medium text-rally-blue">
            {files.length} {files.length === 1 ? "file" : "files"} selected
          </p>
        )}
        <p className="text-sm leading-6 text-zinc-500">
          HEIC photos are rejected for now. Uploaded images are converted to WebP
          display and thumbnail files in your browser before being sent to
          storage.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </div>
      ) : null}

      {progress.length > 0 ? (
        <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3">
          {progress.map((item, index) => (
            <div
              key={`${item.filename}-${index}`}
              className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="truncate font-medium text-zinc-900">
                {item.filename}
              </span>
              <span
                className={`font-semibold ${
                  item.status === "failed"
                    ? "text-red-700"
                    : item.status === "saved"
                      ? "text-emerald-700"
                      : "text-zinc-600"
                }`}
              >
                {item.message}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={uploading}
          className="inline-flex h-10 items-center justify-center rounded-md bg-rally-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rally-blue-hover disabled:cursor-wait disabled:opacity-70"
        >
          {uploading ? "Uploading photos..." : "Upload photos"}
        </button>
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-100"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
