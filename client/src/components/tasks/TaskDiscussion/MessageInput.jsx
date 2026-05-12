import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase/firebaseConfig';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send } from 'lucide-react';
import { toast } from 'sonner';

const MessageInput = ({ taskId }) => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useContext(AuthContext);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size <= 5 * 1024 * 1024) { // 5MB limit
      setFile(selectedFile);
    } else {
      toast.error('File size must be less than 5MB');
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !file) return;
    if (!user) return;

    setUploading(true);
    try {
      let attachmentUrl = null;

      // Upload file if exists
      if (file) {
        const storageRef = ref(storage, `task-attachments/${taskId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        attachmentUrl = await getDownloadURL(snapshot.ref);
      }

      // Add message to Firestore
      await addDoc(collection(db, 'tasks', taskId, 'messages'), {
        text: message.trim(),
        senderId: user.uid,
        senderName: user.name || 'Unknown',
        senderRole: user.role || 'USER',
        senderAvatar: user.avatar || null,
        attachmentUrl,
        type: 'user',
        createdAt: serverTimestamp()
      });

      // Reset form
      setMessage('');
      setFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 border-t border-border space-y-3">
      {file && (
        <div className="flex items-center justify-between bg-muted/50 p-2 rounded gap-2">
          <span className="text-[10px] sm:text-xs truncate min-w-0">{file.name}</span>
          <button
            onClick={() => setFile(null)}
            className="text-[10px] sm:text-xs text-red-600 hover:text-red-700 shrink-0"
          >
            Remove
          </button>
        </div>
      )}
      <div className="flex gap-1.5 sm:gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 min-h-[36px] sm:min-h-[40px] h-9 sm:h-10 text-xs sm:text-sm"
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
        />
        <label className="cursor-pointer flex items-center justify-center h-9 sm:h-10 w-8 sm:w-10 rounded-md hover:bg-accent transition-colors">
          <Paperclip size={16} className="sm:size-[18px] text-muted-foreground hover:text-foreground" />
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.txt,.log"
          />
        </label>
        <Button
          onClick={handleSend}
          disabled={uploading || (!message.trim() && !file)}
          size="sm"
          className="cursor-pointer h-9 sm:h-10 px-2 sm:px-3"
        >
          {uploading ? '...' : <Send size={14} className="sm:size-[16px]" />}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
