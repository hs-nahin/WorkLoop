import { differenceInMilliseconds, isAfter, isBefore, parseISO } from 'date-fns';

/**
 * DeadlineIntelligence handles all the frontend logic for task urgency
 * without modifying the backend schema.
 */
export const DeadlineIntelligence = {
  /**
   * Calculates the urgency status based on the deadline timestamp
   */
  getUrgencyStatus: (deadline) => {
    if (!deadline) return { status: 'NORMAL', label: 'Normal', color: 'neutral', highlight: false };

    const now = new Date();
    const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);

    if (isAfter(now, deadlineDate)) {
      return { 
        status: 'OVERDUE', 
        label: 'Overdue', 
        color: 'destructive', 
        highlight: true,
        priority: 0 
      };
    }

    const diff = differenceInMilliseconds(deadlineDate, now);
    const oneHour = 60 * 60 * 1000;
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (diff <= oneHour) {
      return { 
        status: 'URGENT', 
        label: 'Urgent', 
        color: 'red', 
        highlight: true,
        priority: 1 
      };
    }

    if (diff <= twentyFourHours) {
      return { 
        status: 'DUE_SOON', 
        label: 'Due Soon', 
        color: 'orange', 
        highlight: false,
        priority: 2 
      };
    }

    return { 
      status: 'NORMAL', 
      label: 'Normal', 
      color: 'neutral', 
      highlight: false,
      priority: 3 
    };
  },

  /**
  * Returns a human-readable remaining time string
  */
  getRemainingTime: (deadline) => {
    if (!deadline) return 'No deadline';
    
    const now = new Date();
    const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
    const diff = differenceInMilliseconds(deadlineDate, now);

    if (diff < 0) return 'Overdue';

    if (diff < 60 * 60 * 1000) {
      const mins = Math.ceil(diff / (60 * 1000));
      return `${mins}m left`;
    }
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.ceil(diff / (60 * 60 * 1000));
      return `${hours}h left`;
    }
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    return `${days}d left`;
  }
};
