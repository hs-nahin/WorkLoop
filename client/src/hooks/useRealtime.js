import { useState, useEffect } from 'react';
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

// Real-time task listener
export const useRealTimeTasks = (userRole, userId) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const tasksRef = collection(db, 'tasks');
    let constraints = [];

    // Role-based filtering
    if (userRole === 'IT OFFICER' || userRole === 'ASSISTANT') {
      constraints.push(where('officerId', '==', userId));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(100));

    const q = query(tasksRef, ...constraints);

    const unsubscribeFunc = onSnapshot(q, 
      (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          deadline: doc.data().deadline?.toDate?.() || doc.data().deadline,
        }));
        setTasks(tasksData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching tasks:', err);
        setLoading(false);
      }
    );

    return () => unsubscribeFunc();
  }, [userRole, userId]);

  return { tasks, loading };
};

// Real-time single task listener
export const useRealTimeTask = (taskId) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) {
      setLoading(false);
      return;
    }

    const taskRef = doc(db, 'tasks', taskId);
    const unsubscribeFunc = onSnapshot(taskRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setTask({ id: docSnap.id, ...docSnap.data() });
        } else {
          setTask(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching task:', err);
        setLoading(false);
      }
    );

    return () => unsubscribeFunc();
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

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const tasksRef = collection(db, 'tasks');
    let constraints = [];

    if (userRole === 'IT OFFICER' || userRole === 'ASSISTANT') {
      constraints.push(where('officerId', '==', userId));
    }

    const q = query(tasksRef, ...constraints);

    const unsubscribeFunc = onSnapshot(q,
      (snapshot) => {
        const allTasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        }));

        const pending = allTasks.filter(t => t.status === 'pending').length;
        const inProgress = allTasks.filter(t => t.status === 'in progress').length;
        const submitted = allTasks.filter(t => t.status === 'submitted').length;
        const completed = allTasks.filter(t => t.status === 'completed' || t.status === 'approved').length;
        const rejected = allTasks.filter(t => t.status === 'rejected').length;

        // Weekly trend (last 7 days)
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
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
        console.error('Error fetching stats:', err);
        setLoading(false);
      }
    );

    return () => unsubscribeFunc();
  }, [userId, userRole]);

  return { stats, loading };
};