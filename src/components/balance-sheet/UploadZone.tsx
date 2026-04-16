'use client';

import { useState, useRef, useCallback } from 'react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  error?: string | null;
}

export default function UploadZone({ onFileSelect, isUploading, error }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleClick = () => {
    if (!isUploading) inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const zoneClasses = [
    'bs-upload-zone',
    isDragOver ? 'drag-over' : '',
    isUploading ? 'uploading' : '',
  ].filter(Boolean).join(' ');

  return (
    <div>
      <div
        className={zoneClasses}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Upload balance sheet file"
        id="bs-upload-zone"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xml,.xbrl,.htm,.html"
          onChange={handleChange}
          className="hidden"
          id="bs-file-input"
        />

        <div className="px-6 py-16 sm:py-20 flex flex-col items-center gap-4">
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
            style={{ background: 'var(--bs-accent-dim)' }}
          >
            {isUploading ? (
              <svg className="w-6 h-6" style={{ color: 'var(--bs-accent)', animation: 'bs-spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-6 h-6" style={{ color: 'var(--bs-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>

          {/* Text */}
          {isUploading ? (
            <>
              <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
                Analyzing document…
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {selectedFile?.name}
              </p>
            </>
          ) : (
            <>
              <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
                Drop your balance sheet here
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                or tap to browse · HTM, XML, XBRL
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                Max 25MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="mt-3 px-4 py-3 rounded-lg text-sm bs-fade-in"
          style={{ background: 'var(--bs-critical-bg)', color: 'var(--bs-critical)' }}
        >
          {error}
        </div>
      )}

      {/* Selected file indicator */}
      {selectedFile && !isUploading && !error && (
        <div
          className="mt-3 px-4 py-3 rounded-lg text-sm bs-fade-in flex items-center gap-2"
          style={{ background: 'var(--bs-accent-dim)', color: 'var(--bs-accent)' }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
        </div>
      )}
    </div>
  );
}
