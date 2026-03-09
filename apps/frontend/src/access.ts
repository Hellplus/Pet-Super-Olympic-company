export default function access(initialState: { currentUser?: any } | undefined) {
  const { currentUser } = initialState ?? {};
  const permissions: string[] = currentUser?.permissions || [];

  return {
    canAdmin: currentUser?.isSuperAdmin || permissions.some((p: string) => p.startsWith('system:')),
    hasPermission: (code: string) => currentUser?.isSuperAdmin || permissions.includes(code),
  };
}
