export const DEMO_ROLE_STORAGE_KEY = 'aquanet-demo-role';

export function getDemoRole() {
  if (typeof window === 'undefined') return 'analyst';
  try {
    const role = window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY);
    return role === 'admin' || role === 'analyst' ? role : 'analyst';
  } catch (error) {
    console.warn('Demo role could not be read from local storage; using analyst permissions.', error);
    return 'analyst';
  }
}

export function persistDemoRole(role) {
  try {
    window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, role);
    return true;
  } catch (error) {
    console.warn('Demo role could not be persisted in local storage.', error);
    return false;
  }
}

export function getDemoRoleHeaders() {
  return { 'X-AquaNet-Demo-Role': getDemoRole() };
}
