import { useMemo, useRef, useState } from 'react';
import { FilePlus2, FileText, Trash2, UploadCloud, X } from 'lucide-react';

interface LocalFileItem {
  id: string;
  file: File;
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const rounded = value >= 100 ? value.toFixed(0) : value.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
}

function createFileItem(file: File): LocalFileItem {
  return { id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`, file };
}

export function CustomerPanelRequestsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<LocalFileItem[]>([]);

  const totalSize = useMemo(
    () => selectedFiles.reduce((sum, item) => sum + (item.file.size || 0), 0),
    [selectedFiles],
  );

  function addFiles(files: FileList | File[]) {
    const next = Array.from(files)
      .filter((file) => file.size > 0)
      .map((file) => createFileItem(file));
    if (next.length === 0) return;
    setSelectedFiles((prev) => [...prev, ...next]);
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) return;
    addFiles(event.target.files);
    event.target.value = '';
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }

  function removeFile(id: string) {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  }

  function clearAll() {
    setSelectedFiles([]);
  }

  return (
    <div className="px-6 py-6 max-[900px]:px-4 max-[900px]:py-4">
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Taleplerim</p>
            <h1 className="mt-2 text-xl font-semibold text-slate-900">Yeni Talep ve Dosya Ekleme</h1>
            <p className="mt-1 text-sm text-slate-500">
              Taleplerinize belge eklemek icin dosya yukleyebilirsiniz.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <FilePlus2 size={16} />
              Dosya Sec
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={selectedFiles.length === 0}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={16} />
              Temizle
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="customer-request-files"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
              isDragging
                ? 'border-slate-900 bg-slate-900/5'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
            }`}
          >
            <UploadCloud size={26} className={isDragging ? 'text-slate-900' : 'text-slate-500'} />
            <p className="text-sm font-semibold text-slate-700">Dosyalari buraya surukleyip birakin</p>
            <p className="text-xs text-slate-400">PNG, JPG, PDF veya DOCX - tek seferde coklu dosya</p>
          </label>
          <input
            id="customer-request-files"
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="sr-only"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Eklenen Dosyalar</p>
            <p className="mt-1 text-sm text-slate-500">
              {selectedFiles.length === 0
                ? 'Henuz dosya eklenmedi.'
                : `${selectedFiles.length} dosya, toplam ${formatFileSize(totalSize)}`}
            </p>
          </div>
          <div className="text-xs text-slate-400">Hazir</div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4 grid gap-2">
            {selectedFiles.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white">
                    <FileText size={18} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.file.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(item.file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(item.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  aria-label="Dosyayi kaldir"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
