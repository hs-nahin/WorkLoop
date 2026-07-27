import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { apiRequest } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Upload, X, File } from 'lucide-react';

const AttachmentUpload = ({ taskId, onSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { user } = useContext(AuthContext);
  const [notes, setNotes] = useState('');

  const handleFileChange = (e) => {
    console.log('Files selected:', e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleUpload = async () => {
    console.log('Upload clicked - files:', files.length, 'taskId:', taskId);
    
    if (!user) {
      toast.error('Please log in first');
      return;
    }
    if (files.length === 0) {
      toast.error('Please select files first');
      return;
    }
    if (!taskId) {
      toast.error('Invalid task');
      return;
    }

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const file of files) {
        console.log('Uploading:', file.name);
        try {
          // Upload to Firebase Storage
          const storageRef = ref(storage, `task-attachments/${taskId}/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const fileUrl = await getDownloadURL(snapshot.ref);
          
          console.log('Storage upload done, calling API...');

          // Save to backend
          await apiRequest({
            endpoint: `/tasks/${taskId}/attachments`,
            method: 'POST',
            body: {
              fileName: file.name,
              fileUrl,
              fileSize: file.size,
              fileType: file.type || null,
              notes: notes || null
            }
          });
          
          successCount++;
          console.log('File uploaded successfully');
        } catch (err) {
          console.error('Error uploading file:', err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} file(s) uploaded`);
        setFiles([]);
        setNotes('');
        onSuccess?.();
      }
      if (failCount > 0) {
        toast.error(`${failCount} failed`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <h4 className="text-sm font-bold">Upload New Attachment</h4>
      
      {/* File Input */}
      <div>
        <label className="block text-xs text-muted-foreground mb-2">Select Files</label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.log"
          className="block w-full text-sm text-muted-foreground
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-primary-foreground
            file:cursor-pointer hover:file:bg-opacity-90"
        />
      </div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
              <div className="flex items-center gap-2 overflow-hidden">
                <File size={14} />
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button 
                onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-xs text-muted-foreground mb-2">Notes (optional)</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes..."
          className="h-16"
        />
      </div>

      {/* Upload Button */}
      <Button 
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        className="w-full cursor-pointer"
      >
        {uploading ? (
          <>Uploading...</>
        ) : (
          <><Upload size={14} className="mr-2" />Upload {files.length} File(s)</>
        )}
      </Button>
    </div>
  );
};

export default AttachmentUpload;