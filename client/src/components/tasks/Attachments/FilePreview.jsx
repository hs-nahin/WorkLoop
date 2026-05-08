import { useEffect, useState } from 'react';
import { X, Download, FileText, Image, File } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FilePreview = ({ file, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isImage = (fileType) => {
    return fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file?.fileName || '');
  };

  const isPDF = (fileType, fileName) => {
    return fileType === 'application/pdf' || /\.pdf$/i.test(fileName || '');
  };

  const getFileType = () => {
    if (!file) return 'unknown';
    if (isImage(file.fileType, file.fileName)) return 'image';
    if (isPDF(file.fileType, file.fileName)) return 'pdf';
    return 'other';
  };

  const fileType = getFileType();

  useEffect(() => {
    if (fileType !== 'image' && fileType !== 'pdf') {
      setLoading(false);
    }
  }, [fileType]);

  if (!file) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {fileType === 'image' ? (
              <Image size={18} />
            ) : fileType === 'pdf' ? (
              <FileText size={18} />
            ) : (
              <File size={18} />
            )}
            <div>
              <h3 className="text-sm font-medium">{file.fileName}</h3>
              <p className="text-xs text-muted-foreground">
                Version {file.version} • Uploaded by {file.uploaderName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={file.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              download
            >
              <Button size="sm" variant="outline" className="cursor-pointer">
                <Download size={14} className="mr-1" />
                Download
              </Button>
            </a>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onClose}
              className="cursor-pointer"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {fileType === 'image' && (
            <div className="relative w-full h-full flex items-center justify-center">
              {loading && <p className="text-muted-foreground">Loading image...</p>}
              <img 
                src={file.fileUrl} 
                alt={file.fileName}
                className="max-w-full max-h-[70vh] object-contain"
                onLoad={() => setLoading(false)}
                onError={() => { setError(true); setLoading(false); }}
                style={{ display: loading || error ? 'none' : 'block' }}
              />
              {error && (
                <div className="text-center">
                  <Image size={48} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Failed to load image</p>
                </div>
              )}
            </div>
          )}

          {fileType === 'pdf' && (
            <iframe 
              src={file.fileUrl}
              className="w-full h-[70vh]"
              title={file.fileName}
              onLoad={() => setLoading(false)}
              onError={() => { setError(true); setLoading(false); }}
            />
          )}

          {fileType === 'other' && (
            <div className="text-center space-y-4">
              <FileText size={64} className="mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">{file.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  This file type cannot be previewed. Please download to view.
                </p>
              </div>
              <a 
                href={file.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                download
              >
                <Button className="cursor-pointer">
                  <Download size={16} className="mr-2" />
                  Download File
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
