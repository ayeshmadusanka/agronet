// Cache management utilities

export const clearAllCaches = async () => {
  try {
    // Clear browser cache (if supported)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('Browser caches cleared');
    }

    // Clear localStorage (but preserve authentication)
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    localStorage.clear();
    if (token) localStorage.setItem('token', token);
    if (role) localStorage.setItem('role', role);
    console.log('LocalStorage cleared (auth preserved)');

    // Clear sessionStorage
    sessionStorage.clear();
    console.log('SessionStorage cleared');

    return true;
  } catch (error) {
    console.error('Error clearing caches:', error);
    return false;
  }
};

export const clearBrowserCache = () => {
  // Force page reload without cache
  if (window.location.reload) {
    window.location.reload(true); // Hard refresh
  }
};

export const addCacheBustingHeaders = (config = {}) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    params: {
      ...config.params,
      _cacheBust: Date.now()
    }
  };
};