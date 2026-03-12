/**
 * File Upload Component
 *
 * Allows users to upload their Apple Health export for analysis.
 */

"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { File, Upload, X } from "lucide-react";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onUpload: () => void;
  isUploading: boolean;
  disabled?: boolean;
  acceptedFileTypes?: string;
  maxSizeMB?: number;
  t: any; // Dictionary translations
  /** Optional slot rendered between the drop area and the upload button */
  consentSlot?: React.ReactNode;
}

export function FileUpload({
  onFileSelect,
  onUpload,
  isUploading,
  disabled = false,
  acceptedFileTypes = ".zip",
  maxSizeMB = 150,
  t,
  consentSlot,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Upload elapsed timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isUploading) {
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isUploading]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return false;
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".zip")) {
      setError("Only .zip files are supported (Apple Health export format)");
      return false;
    }

    // Check minimum file size (Apple Health exports are typically > 1KB)
    if (file.size < 1024) {
      setError(
        "File appears to be too small. Please ensure it's a valid Apple Health export."
      );
      return false;
    }

    setError(null);
    return true;
  };

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    if (selectedFile && !isUploading) {
      onUpload();
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-colors",
          dragActive && "border-accent bg-accent/5",
          !dragActive && "border-border hover:border-accent/50",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-destructive"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!disabled ? handleClick : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={acceptedFileTypes}
          onChange={handleChange}
          disabled={disabled}
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="p-4 rounded-full bg-muted">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-foreground font-medium">
                {t.analyze.upload.dragHint}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.analyze.upload.description}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <File className="h-5 w-5 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
            </div>
            {!isUploading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Consent slot */}
      {consentSlot}

      {/* Upload button */}
      {selectedFile && (
        <Button
          onClick={handleUploadClick}
          disabled={isUploading || disabled}
          className="w-full bg-[#C3F531] hover:bg-[#C3F531] text-black font-medium focus:ring-2 focus:ring-[#C3F531]/50 active:brightness-95"
          size="lg"
        >
          {isUploading
            ? `${t.analyze.upload.buttonUploading} ${formatTime(elapsed)}`
            : t.analyze.upload.buttonUpload}
        </Button>
      )}
    </div>
  );
}
