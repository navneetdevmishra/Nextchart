import React from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface MediaViewerModalProps {
  isOpen: boolean;
  fileUrl: string;
  fileType: string;
  fileName: string;
  onClose: () => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  isOpen,
  fileUrl,
  fileType,
  fileName,
  onClose,
}) => {
  const [scale, setScale] = React.useState(1);

  if (!isOpen) return null;

  const isVideo = fileType.startsWith('video');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
        {!isVideo && (
          <>
            <button
              onClick={() => setScale((s) => Math.min(s + 0.25, 3))}
              className="p-1.5 text-white/80 hover:text-white transition"
              title="Zoom in"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
              className="p-1.5 text-white/80 hover:text-white transition"
              title="Zoom out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
          </>
        )}
        <a
          href={fileUrl}
          download={fileName}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 text-white/80 hover:text-white transition"
          title="Download file"
        >
          <Download className="w-5 h-5" />
        </a>
        <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white transition" title="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="max-w-4xl max-h-[85vh] overflow-hidden flex items-center justify-center">
        {isVideo ? (
          <video src={fileUrl} controls autoPlay className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl" />
        ) : (
          <img
            src={fileUrl}
            alt={fileName}
            style={{ transform: `scale(${scale})` }}
            className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl transition-transform duration-150"
          />
        )}
      </div>
    </div>
  );
};
