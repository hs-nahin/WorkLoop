import { useContext, useMemo, useEffect, useState } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { hasPermission, loadPermissions } from '@/lib/permissions';

const usePermissions = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const role = user?.role || '';

  useEffect(() => {
    const init = async () => {
      await loadPermissions();
      setLoading(false);
    };
    init();
  }, []);

  const can = useMemo(() => {
    return (permission) => hasPermission(role, permission);
  }, [role, loading]);

  const permissions = useMemo(() => ({
    can,
    role,
    loading,
    isAdmin: hasPermission(role, 'TASK_APPROVE'),
    isOfficer: hasPermission(role, 'TASK_ACCEPT'),
    isAssistant: hasPermission(role, 'COMMENT_CREATE') && !hasPermission(role, 'TASK_ACCEPT'),
  }), [can, role, loading]);

  return permissions;
};

export default usePermissions;
