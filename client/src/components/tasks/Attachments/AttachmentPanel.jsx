import { useEffect, useState, useContext } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AuthContext } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Image, File, Trash2, Eye } from 'lucide-react';
import { apiRequest } from '@/api/apiClient';
import AttachmentUpload from './AttachmentUpload';
import FilePreview from './FilePreview';
import { toast } from 'sonner';
import { hasPermission } from '@/lib/permissions';

const AttachmentPanel = ({ taskId, task }) => {
  const { user } = useContext(AuthContext);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [groupedAttachments, setGroupedAttachments] = useState({});

  // Real-time listener for attachments
  useEffect(() => {
    if (!taskId) return;

    let unsubscribe = () => {};
    try {
      const q = query(
        collection(db, 'tasks', taskId, 'attachments'),
        orderBy('uploadedAt', 'desc')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const atts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          uploadedAt: doc.data().uploadedAt?.toDate ? doc.data().uploadedAt.toDate() : new Date()
        }));
        setAttachments(atts);
        
        const grouped = atts.reduce((acc, att) => {
          const key = att.baseFileName || att.fileName;
          if (!acc[key]) acc[key] = [];
          acc[key].push(att);
          return acc;
        }, {});
        setGroupedAttachments(grouped);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching attachments:', error);
        setLoading(false);
      });
    } catch (err) {
      console.error('Failed to initialize attachments listener:', err);
      setLoading(false);
    }

    return () => { try { unsubscribe(); } catch (_) {} };
  }, [taskId]);

  const canUpload = () => {
    if (!user || !task) return false;
    return hasPermission(user.role, 'ATTACHMENT_UPLOAD') && (
      user.uid === task.officerId ||
      user.uid === task.assistantId ||
      hasPermission(user.role, 'TASK_VIEW_ALL')
    );
  };

  const canDelete = (attachment) => {
    if (!user) return false;
    return (
      user.uid === attachment.uploadedBy ||
      hasPermission(user.role, 'ATTACHMENT_DELETE') ||
      (task && user.uid === task.officerId)
    );
  };

  const handleDelete = async (attachmentId, fileName) => {
    if (!confirm(`Delete ${fileName}? This action cannot be undone.`)) return;
    
    try {
      await apiRequest({
        endpoint: `/tasks/${taskId}/attachments/${attachmentId}`,
        method: 'DELETE'
      });
      toast.success('Attachment deleted');
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error('Failed to delete attachment');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (loading) return <div className="text-center py-4 text-muted-foreground">Loading attachments...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <FileText size={16} className="sm:size-[18px] shrink-0" />
            <span className="truncate">Attachments & Version History</span>
            <span className="text-xs bg-muted px-2 py-1 rounded shrink-0">
              {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
            </span>
          </CardTitle>
          {canUpload() && (
            <Button
              onClick={() => setShowUpload(!showUpload)}
              size="sm"
              className="cursor-pointer w-full sm:w-auto"
            >
              <Upload size={14} className="sm:size-[16px] mr-1.5" />
              {showUpload ? 'Cancel' : 'Upload Files'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showUpload && (
          <AttachmentUpload 
            taskId={taskId} 
            onSuccess={() => setShowUpload(false)} 
          />
        )}
        
        {Object.keys(groupedAttachments).length === 0 ? (
          <p className="text-muted-foreground text-xs sm:text-sm py-6 sm:py-8 text-center px-2">
            No attachments yet. Upload files to get started!
          </p>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {Object.entries(groupedAttachments).map(([baseName, files]) => (
              <div key={baseName} className="border border-border rounded-lg p-3 sm:p-4">
                <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 break-words">
                  <File size={14} className="sm:size-[16px] shrink-0" />
                  <span className="truncate">{baseName}</span>
                  <span className="text-[10px] sm:text-xs bg-blue-600/10 text-blue-600 px-1.5 sm:px-2 py-0.5 rounded shrink-0">
                    {files.length} version{files.length > 1 ? 's' : ''}
                  </span>
                </h4>
                <div className="space-y-1.5 sm:space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 rounded bg-muted/30 hover:bg-muted/50 transition-colors gap-2">
                      <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                        <span className="text-[10px] sm:text-xs bg-green-600/10 text-green-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-mono shrink-0 mt-0.5">
                          v{file.version}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium break-words">{file.fileName}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                            {file.uploaderName || 'Unknown'} • {file.uploadedAt?.toLocaleString()} • {formatFileSize(file.fileSize)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewFile(file)}
                          className="cursor-pointer h-7 w-7 sm:h-8 sm:w-8"
                        >
                          <Eye size={12} className="sm:size-[14px]" />
                        </Button>
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Button size="sm" variant="ghost" className="cursor-pointer h-7 w-7 sm:h-8 sm:w-8">
                            <FileText size={12} className="sm:size-[14px]" />
                          </Button>
                        </a>
                        {canDelete(file) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(file.id, file.fileName)}
                            className="cursor-pointer text-red-600 hover:text-red-700 h-7 w-7 sm:h-8 sm:w-8"
                          >
                            <Trash2 size={12} className="sm:size-[14px]" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {previewFile && (
        <FilePreview 
          file={previewFile} 
          onClose={() => setPreviewFile(null)} 
        />
      )}
    </Card>
  );
};

export default AttachmentPanel;
