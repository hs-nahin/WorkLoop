import { useContext, useMemo, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { hasPermission, onPermissionsReady } from '@/lib/permissions';

const usePermissions = () => {
  const { user } = useContext(AuthContext);
  const [ready, setReady] = useState(false);
  const role = user?.role || '';

  useEffect(() => {
    onPermissionsReady(() => setReady(true));
  }, []);

  const can = useCallback((permission) => {
    return hasPermission(role, permission);
  }, [role, ready]);

  const isAdmin = useMemo(() => hasPermission(role, 'TASK_APPROVE'), [role, ready]);
  const isOfficer = useMemo(() => hasPermission(role, 'TASK_ACCEPT'), [role, ready]);
  const isAssistant = useMemo(() => hasPermission(role, 'COMMENT_CREATE') && !hasPermission(role, 'TASK_ACCEPT'), [role, ready]);

  return { can, role, loading: !ready, isAdmin, isOfficer, isAssistant };
};

export default usePermissions;
