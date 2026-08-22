export type AuthRouteAccess = {
  canAccessAppRoutes: boolean;
  canAccessAuthRoutes: boolean;
};

export function getAuthRouteAccess(
  isLoading: boolean,
  hasSession: boolean,
  hasActiveAuthFlow: boolean,
): AuthRouteAccess {
  return {
    canAccessAppRoutes: (isLoading || hasSession) && !hasActiveAuthFlow,
    canAccessAuthRoutes: isLoading || (!hasSession && !hasActiveAuthFlow),
  };
}
