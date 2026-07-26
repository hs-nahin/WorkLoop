import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  doc 
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

const safeUnsub = (ref) => {
  if (ref.current) {
    try { ref.current(); } catch (_) {}
    ref.current = null;
  }
};

// Real-time task listener
export const useRealTimeTasks = (userId, userRole) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!userId) { setLoading(false); return; }

    safeUnsub(unsubRef);

    try {
      const tasksRef = collection(db, 'tasks');
      let constraints = [];
      if ((userRole || '').toUpperCase() !== 'ADMIN') {
        constraints.push(where('officerId', '==', userId));
      }
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(100));

      const q = query(tasksRef, ...constraints);

      unsubRef.current = onSnapshot(q,
        (snapshot) => {
          if (!mountedRef.current) return;
          const tasksData = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.() || d.data().createdAt,
            deadline: d.data().deadline?.toDate?.() || d.data().deadline,
          }));
          setTasks(tasksData);
          setLoading(false);
        },
        (err) => {
          if (!mountedRef.current) return;
          console.error('Error fetching tasks:', err);
          setTasks([]);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Failed to initialize task listener:', err);
      if (mountedRef.current) {
        setTasks([]);
        setLoading(false);
      }
    }

    return () => {
      mountedRef.current = false;
      safeUnsub(unsubRef);
    };
  }, [userRole, userId]);

  return { tasks, loading };
};

// Real-time single task listener
export const useRealTimeTask = (taskId) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!taskId) { setLoading(false); return; }

    safeUnsub(unsubRef);

    try {
      const taskRef = doc(db, 'tasks', taskId);
      unsubRef.current = onSnapshot(taskRef,
        (docSnap) => {
          if (!mountedRef.current) return;
          if (docSnap.exists()) {
            setTask({ id: docSnap.id, ...docSnap.data() });
          } else {
            setTask(null);
          }
          setLoading(false);
        },
        (err) => {
          if (!mountedRef.current) return;
          console.error('Error fetching task:', err);
          setTask(null);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Failed to initialize task listener:', err);
      if (mountedRef.current) {
        setTask(null);
        setLoading(false);
      }
    }

    return () => {
      mountedRef.current = false;
      safeUnsub(unsubRef);
    };
  }, [taskId]);

  return { task, loading };
};

// Real-time dashboard stats - extended with analytics
export const useRealTimeStats = (userId, userRole) => {
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    submitted: 0,
    completed: 0,
    total: 0,
    rejected: 0,
    statusCounts: { pending: 0, inProgress: 0, submitted: 0, completed: 0, rejected: 0 },
    weeklyTrend: [],
    tasks: []
  });
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!userId) { setLoading(false); return; }

    safeUnsub(unsubRef);

    try {
      const tasksRef = collection(db, 'tasks');
      let constraints = [];
      if ((userRole || '').toUpperCase() !== 'ADMIN') {
        constraints.push(where('officerId', '==', userId));
      }

      const q = query(tasksRef, ...constraints);

      unsubRef.current = onSnapshot(q,
        (snapshot) => {
          if (!mountedRef.current) return;
          const allTasks = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.() || d.data().createdAt,
          }));

          const pending = allTasks.filter(t => t.status === 'pending').length;
          const inProgress = allTasks.filter(t => t.status === 'in progress').length;
          const submitted = allTasks.filter(t => t.status === 'submitted').length;
          const completed = allTasks.filter(t => t.status === 'completed' || t.status === 'approved').length;
          const rejected = allTasks.filter(t => t.status === 'rejected').length;

          const now = new Date();
          const weeklyTrend = [];
          for (let i = 6; i >= 0; i--) {
            const day = new Date(now);
            day.setDate(day.getDate() - i);
            const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            const dayTasks = allTasks.filter(t => {
              const created = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
              return created >= dayStart && created < dayEnd;
            });
            weeklyTrend.push({
              date: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
              created: dayTasks.length,
              completed: dayTasks.filter(t => t.status === 'completed' || t.status === 'approved').length,
              submitted: dayTasks.filter(t => t.status === 'submitted').length,
            });
          }

          setStats({
            pending,
            inProgress,
            submitted,
            completed,
            total: allTasks.length,
            rejected,
            statusCounts: { pending, inProgress, submitted, completed, rejected },
            weeklyTrend,
            tasks: allTasks,
          });
          setLoading(false);
        },
        (err) => {
          if (!mountedRef.current) return;
          console.error('Error fetching stats:', err);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Failed to initialize stats listener:', err);
      if (mountedRef.current) {
        setLoading(false);
      }
    }

    return () => {
      mountedRef.current = false;
      safeUnsub(unsubRef);
    };
  }, [userId, userRole]);

  return { stats, loading };
};
