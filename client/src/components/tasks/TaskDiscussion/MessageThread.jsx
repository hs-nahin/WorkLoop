import { useEffect, useRef, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

const MessageThread = ({ taskId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { user } = useContext(AuthContext);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!taskId) return;

    const q = query(
      collection(db, 'tasks', taskId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
      }));
      setMessages(msgs);
      setLoading(false);
      scrollToBottom();
    }, (error) => {
      console.error('Error fetching messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [taskId]);

  if (loading) return <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">Loading messages...</div>;
  if (messages.length === 0) return <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground px-4">No messages yet. Start the discussion!</div>;

  return (
    <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto p-3 sm:p-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.senderRole === 'ADMIN' ? 'justify-start' : msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] sm:max-w-[75%] rounded-lg p-2 sm:p-3 ${
              msg.senderRole === 'SYSTEM' 
                ? 'bg-muted/50 border border-border text-center w-full max-w-full'
                : msg.senderRole === 'ADMIN'
                ? 'bg-red-600/10 border border-red-600/30 text-foreground'
                : msg.senderId === user?.uid
                ? 'bg-blue-600/10 border border-blue-600/30 text-foreground'
                : 'bg-muted/50 border border-border text-foreground'
            }`}
          >
            {msg.senderRole !== 'SYSTEM' && (
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                <span className="text-[11px] sm:text-xs font-bold">{msg.senderName || 'Unknown'}</span>
                <span className={`text-[9px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded ${
                  msg.senderRole === 'ADMIN' 
                    ? 'bg-red-600/20 text-red-600'
                    : msg.senderRole === 'IT OFFICER'
                    ? 'bg-blue-600/20 text-blue-600'
                    : 'bg-green-600/20 text-green-600'
                }`}>
                  {msg.senderRole}
                </span>
              </div>
            )}
            <p className="text-xs sm:text-sm break-words">{msg.text}</p>
            {msg.attachmentUrl && (
              <a 
                href={msg.attachmentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-blue-600 hover:underline mt-1 block break-words"
              >
                View Attachment
              </a>
            )}
            {msg.senderRole !== 'SYSTEM' && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageThread;
