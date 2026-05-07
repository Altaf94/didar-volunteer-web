import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for checking user permissions
 * @returns {Object} Permission check functions and permission state
 */
export const usePermissions = () => {
  const { permissions } = useAuth();

  return {
    canView: permissions?.canView ?? false,
    canMake: permissions?.canMake ?? false,
    canCheck: permissions?.canCheck ?? false,
    hasAnyPermission: () => {
      return permissions?.canView || permissions?.canMake || permissions?.canCheck;
    },
    hasAllPermissions: () => {
      return permissions?.canView && permissions?.canMake && permissions?.canCheck;
    },
  };
};
