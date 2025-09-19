/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React from 'react';
import { usePermissions } from '../../hooks/useAuth';

const RoleGuard = ({ 
  roles = [], 
  requireAll = false, 
  fallback = null, 
  children 
}) => {
  const { hasRole } = usePermissions();

  const hasAccess = requireAll 
    ? roles.every(role => hasRole(role))
    : roles.some(role => hasRole(role)) || roles.length === 0;

  if (!hasAccess) {
    return fallback;
  }

  return children;
};

export default RoleGuard;