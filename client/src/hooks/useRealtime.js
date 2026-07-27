import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { apiRequest } from '@/api/apiClient';
import { hasPermission, onPermissionsChange, getPermissionsVersion } from '@/lib/permissions';

const safeUnsub = (ref) => {
  if (ref.current) {
    try { ref.current(); } catch { /* noop */ }
    ref.current = null;
  }
};

const normalizeTimestamp = (ts) => {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts?.toDate === 'function') return ts.toDate();
  if (ts._seconds != null) return new Date(ts._seconds * 1000);
  try { return new Date(ts); } catch { return null; }
};

const normalizeTask = (t) => ({
  ...t,
  createdAt: normalizeTimestamp(t.createdAt),
  deadline: normalizeTimestamp(t.deadline),
  acceptedAt: normalizeTimestamp(t.acceptedAt),
  workStartedAt: normalizeTimestamp(t.workStartedAt),
  submittedAt: normalizeTimestamp(t.submittedAt),
  completedAt: normalizeTimestamp(t.completedAt),
});

const sortTasksDesc = (arr) => {
  return [...arr].sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
};

const applyPermissionFilter = (tasks, userRole, userId) => {
  const canViewAll = hasPermission(userRole, 'TASK_VIEW_ALL');
  let result = tasks.map(normalizeTask);
  if (!canViewAll) {
    result = result.filter(t => t.officerId === userId || t.createdBy === userId);
  }
  return sortTasksDesc(result);
};

// ────────────────────────────────────────────────────────────
// Real-time task list (API seed + Firestore overlay)
// ────────────────────────────────────────────────────────────
export const useRealTimeTasks = (userId, userRole) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef(null);
  const mountedRef = useRef(true);
  const firestoreReady = useRef(false);
  const [permVersion, setPermVersion] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    firestoreReady.current = false;
    if (!userId) { setTasks([]); setLoading(false); return; }

    safeUnsub(unsubRef);

    const canViewAll = hasPermission(userRole, 'TASK_VIEW_ALL');

    // ── Step 1: Seed data from REST API (Admin SDK, best-effort fast path) ──
    let cancelled = false;
    apiRequest({ endpoint: '/tasks' })
      .then((data) => {
        if (cancelled || firestoreReady.current) return;
        setTasks(applyPermissionFilter(data || [], userRole, userId));
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Tasks API seed failed (Firestore will provide data):', err?.message || err);
      });

    // ── Step 2: Firestore real-time listener (overlay) ──
    try {
      const tasksRef = collection(db, 'tasks');
      let constraints = [];
      if (!canViewAll) {
        constraints.push(where('officerId', '==', userId));
      }
      if (canViewAll) {
        constraints.push(orderBy('createdAt', 'desc'));
      }
      constraints.push(limit(100));

      const q = query(tasksRef, ...constraints);

      unsubRef.current = onSnapshot(q,
        (snapshot) => {
          if (!mountedRef.current || cancelled) return;
          firestoreReady.current = true;
          const tasksData = snapshot.docs.map(d => normalizeTask({ id: d.id, ...d.data() }));
          if (!canViewAll) {
            const filtered = tasksData.filter(t => t.officerId === userId || t.createdBy === userId);
            setTasks(sortTasksDesc(filtered));
          } else {
            setTasks(sortTasksDesc(tasksData));
          }
          setLoading(false);
        },
        (err) => {
          if (!mountedRef.current || cancelled) return;
          console.warn('Firestore tasks listener failed, using API polling:', err?.message);
          firestoreReady.current = false;
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn('Failed to init Firestore tasks listener:', err?.message);
      if (mountedRef.current && !cancelled) setLoading(false);
    }

    // ── Step 3: Polling fallback (if Firestore onSnapshot fails) ──
    const pollInterval = setInterval(() => {
      if (cancelled || firestoreReady.current) return;
      apiRequest({ endpoint: '/tasks' })
        .then((data) => {
          if (cancelled || firestoreReady.current) return;
          setTasks(applyPermissionFilter(data || [], userRole, userId));
        })
        .catch(() => {});
    }, 30000);

    return () => {
      cancelled = true;
      mountedRef.current = false;
      safeUnsub(unsubRef);
      clearInterval(pollInterval);
    };
  }, [userRole, userId, permVersion]);

  // Re-evaluate when permissions change
  useEffect(() => {
    const unsub = onPermissionsChange(() => {
      setPermVersion(getPermissionsVersion());
    });
    return () => unsub();
  }, []);

  return { tasks, loading };
};

// ────────────────────────────────────────────────────────────
// Real-time single task (API seed + Firestore overlay)
// ────────────────────────────────────────────────────────────
export const useRealTimeTask = (taskId) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubRef = useRef(null);
  const mountedRef = useRef(true);
  const firestoreReady = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    firestoreReady.current = false;
    if (!taskId) { setTask(null); setLoading(false); return; }

    safeUnsub(unsubRef);
    setTask(null);
    setLoading(true);
    setError(null);

    let cancelled = false;

    // ── Step 1: Seed from API (fast path, best-effort) ──
    apiRequest({ endpoint: `/tasks/${taskId}` })
      .then((data) => {
        if (cancelled || firestoreReady.current) return;
        setTask(normalizeTask(data));
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Task API seed failed (Firestore will provide data):', err?.message || err);
      });

    // ── Step 2: Firestore real-time listener (authoritative source) ──
    try {
      const taskRef = doc(db, 'tasks', taskId);
      unsubRef.current = onSnapshot(taskRef,
        (docSnap) => {
          if (!mountedRef.current || cancelled) return;
          firestoreReady.current = true;
          if (docSnap.exists()) {
            setTask(normalizeTask({ id: docSnap.id, ...docSnap.data() }));
          } else {
            setTask(null);
          }
          setError(null);
          setLoading(false);
        },
        (err) => {
          if (!mountedRef.current || cancelled) return;
          console.warn('Firestore task listener failed, using API polling:', err?.message);
          firestoreReady.current = false;
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn('Failed to init Firestore task listener:', err?.message);
      if (mountedRef.current && !cancelled) setLoading(false);
    }

    // ── Step 3: Polling fallback (if Firestore onSnapshot fails) ──
    const pollInterval = setInterval(() => {
      if (cancelled || firestoreReady.current) return;
      apiRequest({ endpoint: `/tasks/${taskId}` })
        .then((data) => {
          if (cancelled || firestoreReady.current) return;
          setTask(normalizeTask(data));
        })
        .catch(() => {});
    }, 30000);

    return () => {
      cancelled = true;
      mountedRef.current = false;
      safeUnsub(unsubRef);
      clearInterval(pollInterval);
    };
  }, [taskId]);

  const refresh = useCallback(async () => {
    if (!taskId) return;
    try {
      const data = await apiRequest({ endpoint: `/tasks/${taskId}` });
      if (data) setTask(normalizeTask(data));
    } catch (err) {
      console.warn('Task refresh failed:', err?.message);
    }
  }, [taskId]);

  return { task, loading, error, refresh };
};

// ────────────────────────────────────────────────────────────
// Real-time task messages (single subscription, shared by components)
// ────────────────────────────────────────────────────────────
export const useRealTimeMessages = (taskId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!taskId) { setMessages([]); setLoading(false); return; }

    safeUnsub(unsubRef);
    setLoading(true);

    try {
      const q = query(
        collection(db, 'tasks', taskId, 'messages'),
        orderBy('createdAt', 'asc')
      );

      unsubRef.current = onSnapshot(q,
        (snapshot) => {
          if (!mountedRef.current) return;
          const msgs = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date()
          }));
          setMessages(msgs);
          setLoading(false);
        },
        (err) => {
          if (!mountedRef.current) return;
          console.warn('Messages listener failed:', err?.message);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn('Failed to init messages listener:', err?.message);
      if (mountedRef.current) setLoading(false);
    }

    return () => {
      mountedRef.current = false;
      safeUnsub(unsubRef);
    };
  }, [taskId]);

  return { messages, loading };
};

// ────────────────────────────────────────────────────────────
// Real-time notifications (API seed + Firestore overlay)
// ────────────────────────────────────────────────────────────
export const useRealtimeNotifications = (userId, userRole) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const unsubRef = useRef(null);
  const mountedRef = useRef(true);
  const firestoreReady = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    firestoreReady.current = false;
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    safeUnsub(unsubRef);
    let cancelled = false;

    // ── Step 1: Seed from API (best-effort fast path) ──
    const notifEndpoint = (userRole || '').toUpperCase() === 'ADMIN' ? '/notifications' : '/notifications/officer';
    apiRequest({ endpoint: notifEndpoint })
      .then((data) => {
        if (cancelled || firestoreReady.current) return;
        const notifs = (data || []).sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Notifications API seed failed (Firestore will provide data):', err?.message || err);
      });

    // ── Step 2: Firestore real-time listener (overlay) ──
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, where('userId', '==', userId));

      unsubRef.current = onSnapshot(q,
        (snapshot) => {
          if (!mountedRef.current || cancelled) return;
          firestoreReady.current = true;
          const notifs = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
              const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
              const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
              return dateB - dateA;
            });
          setNotifications(notifs);
          setUnreadCount(notifs.filter(n => !n.read).length);
        },
        (err) => {
          if (!mountedRef.current || cancelled) return;
          console.warn('Notifications listener failed, using API polling:', err?.message);
          firestoreReady.current = false;
        }
      );
    } catch (err) {
      console.warn('Failed to init notifications listener:', err?.message);
    }

    // ── Step 3: Polling fallback (if Firestore onSnapshot fails) ──
    const pollInterval = setInterval(() => {
      if (cancelled || firestoreReady.current) return;
      apiRequest({ endpoint: notifEndpoint })
        .then((data) => {
          if (cancelled || firestoreReady.current) return;
          const notifs = (data || []).sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB - dateA;
          });
          setNotifications(notifs);
          setUnreadCount(notifs.filter(n => !n.read).length);
        })
        .catch(() => {});
    }, 30000);

    return () => {
      cancelled = true;
      mountedRef.current = false;
      safeUnsub(unsubRef);
      clearInterval(pollInterval);
    };
  }, [userId, userRole]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const ref = doc(db, 'notifications', notificationId);
      await updateDoc(ref, { read: true });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      try {
        const ref = doc(db, 'notifications', n.id);
        await updateDoc(ref, { read: true });
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const ref = doc(db, 'notifications', notificationId);
      await deleteDoc(ref);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    deleteNotification,
  };
};
