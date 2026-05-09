import { useEffect, useState, useContext } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
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

    const q = query(
      collection(db, 'tasks', taskId, 'attachments'),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const atts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate ? doc.data().uploadedAt.toDate() : new Date()
      }));
      setAttachments(atts);
      
      // Group by baseFileName for version history
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

    return () => unsubscribe();
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
      user.role === 'ADMIN' ||
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
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText size={18} />
            Attachments & Version History
            <span className="text-xs bg-muted px-2 py-1 rounded">
              {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
            </span>
          </CardTitle>
          {canUpload() && (
            <Button 
              onClick={() => setShowUpload(!showUpload)}
              size="sm"
              className="cursor-pointer"
            >
              <Upload size={16} className="mr-1" />
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
          <p className="text-muted-foreground text-sm py-4 text-center">
            No attachments yet. Upload files to get started!
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedAttachments).map(([baseName, files]) => (
              <div key={baseName} className="border border-border rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <File size={16} />
                  {baseName}
                  <span className="text-xs bg-blue-600/10 text-blue-600 px-2 py-0.5 rounded">
                    {files.length} version{files.length > 1 ? 's' : ''}
                  </span>
                </h4>
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-xs bg-green-600/10 text-green-600 px-2 py-1 rounded font-mono">
                          v{file.version}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{file.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded by {file.uploaderName || 'Unknown'} • {file.uploadedAt?.toLocaleString()} • {formatFileSize(file.fileSize)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewFile(file)}
                          className="cursor-pointer"
                        >
                          <Eye size={14} />
                        </Button>
                        <a 
                          href={file.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          download
                        >
                          <Button size="sm" variant="ghost" className="cursor-pointer">
                            <FileText size={14} />
                          </Button>
                        </a>
                        {canDelete(file) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(file.id, file.fileName)}
                            className="cursor-pointer text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={14} />
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
