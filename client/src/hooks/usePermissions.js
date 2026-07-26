import { useContext, useMemo, useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';

const usePermissions = () => {
  const { user, permissionsVersion } = useContext(AuthContext);
  const role = user?.role || '';

  const can = useCallback((permission) => {
    return hasPermission(role, permission);
  }, [role, permissionsVersion]);

  const isAdmin = useMemo(() => hasPermission(role, 'TASK_APPROVE'), [role, permissionsVersion]);
  const isOfficer = useMemo(() => hasPermission(role, 'TASK_ACCEPT'), [role, permissionsVersion]);
  const isAssistant = useMemo(() => hasPermission(role, 'COMMENT_CREATE') && !hasPermission(role, 'TASK_ACCEPT'), [role, permissionsVersion]);

  return { can, role, loading: false, isAdmin, isOfficer, isAssistant };
};

export default usePermissions;
