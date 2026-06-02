"use client";

import { useRef } from "react";
import { FileUp, FolderUp, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadDropzoneProps = {
  onAddFiles: (files: File[]) => void;
  disabled?: boolean;
  embedded?: boolean;
};

export function UploadDropzone({
  onAddFiles,
  disabled,
  embedded = false,
}: UploadDropzoneProps) {
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const collectFiles = (fileList: FileList | null, input?: HTMLInputElement) => {
    if (!fileList || fileList.length === 0) return;
    onAddFiles(Array.from(fileList));
    if (input) input.value = "";
  };

  const dropzone = (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        collectFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center transition sm:py-8",
        embedded ? "min-h-[11rem] h-full" : "min-h-52",
        !disabled && "hover:border-brand-400 hover:bg-brand-50/40",
        disabled && "opacity-65",
      )}
    >
      <UploadCloud className="mb-2 h-8 w-8 text-brand-600" />
      <p className="text-base font-semibold text-zinc-900 sm:text-lg">
        Drag and drop resumes here
      </p>
      <p className="mt-1 max-w-md text-xs text-zinc-600 sm:text-sm">
        Upload individual PDFs, multiple files, or an entire folder.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => filesInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileUp className="h-4 w-4 text-brand-600" />
          Select PDFs
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => folderInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FolderUp className="h-4 w-4 text-brand-600" />
          Select Folder
        </button>
      </div>
    </div>
  );

  const inputs = (
    <>
      <input
        ref={filesInputRef}
        disabled={disabled}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => collectFiles(e.target.files, e.currentTarget)}
      />
      <input
        ref={folderInputRef}
        disabled={disabled}
        type="file"
        multiple
        className="hidden"
        {...({ webkitdirectory: "true", directory: "true" } as Record<string, string>)}
        onChange={(e) => collectFiles(e.target.files, e.currentTarget)}
      />
    </>
  );

  if (embedded) {
    return (
      <div className="h-full min-h-0">
        {dropzone}
        {inputs}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft sm:p-5">
      {dropzone}
      {inputs}
    </section>
  );
}
