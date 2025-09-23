import { 
  useInvitations, 
  useAlbums, 
  usePublicAlbums, 
  useFeaturedAlbums,
  useAllMedia,
  usePendingMedia,
  useRSVPs,
  useStats,
  useFirebaseCleanup
} from '../hooks/useFirebaseRealtime';

// Pure Firebase real-time hooks
// These hooks use only Firebase real-time listeners for data

export function useInvitationsWithRealtime() {
  const firebaseData = useInvitations();
  
  return {
    data: firebaseData.data,
    loading: firebaseData.loading,
    error: firebaseData.error,
    mutate: firebaseData.mutate
  };
}

export function useAlbumsWithRealtime() {
  const firebaseData = useAlbums();
  
  return {
    data: firebaseData.data,
    loading: firebaseData.loading,
    error: firebaseData.error,
    mutate: firebaseData.mutate
  };
}

export function usePublicAlbumsWithRealtime() {
  const firebaseData = usePublicAlbums();
  
  return {
    data: firebaseData.data,
    loading: firebaseData.loading,
    error: firebaseData.error,
    mutate: firebaseData.mutate
  };
}

export function useFeaturedAlbumsWithRealtime() {
  const firebaseData = useFeaturedAlbums();
  
  return {
    data: firebaseData.data,
    loading: firebaseData.loading,
    error: firebaseData.error,
    mutate: firebaseData.mutate
  };
}

export function useAllMediaWithRealtime() {
  const firebaseData = useAllMedia();
  
  return {
    data: firebaseData.data,
    loading: firebaseData.loading,
    error: firebaseData.error,
    mutate: firebaseData.mutate
  };
}

export function usePendingMediaWithRealtime() {
  const firebaseData = usePendingMedia();
  
  return {
    data: firebaseData.data,
    loading: firebaseData.loading,
    error: firebaseData.error,
    mutate: firebaseData.mutate
  };
}

export function useRSVPsWithRealtime() {
  const firebaseData = useRSVPs();
  
  return {
    data: firebaseData.data,
    loading: firebaseData.loading,
    error: firebaseData.error,
    mutate: firebaseData.mutate
  };
}

export function useStatsWithRealtime() {
  const firebaseData = useStats();
  
  return {
    data: firebaseData.stats,
    loading: firebaseData.loading,
    error: firebaseData.error,
    mutate: firebaseData.mutate
  };
}

// Hook for components that need real-time data
export function useRealtimeData() {
  // Cleanup Firebase listeners when component unmounts
  useFirebaseCleanup();
  
  return {
    invitations: useInvitationsWithRealtime(),
    albums: useAlbumsWithRealtime(),
    publicAlbums: usePublicAlbumsWithRealtime(),
    featuredAlbums: useFeaturedAlbumsWithRealtime(),
    allMedia: useAllMediaWithRealtime(),
    pendingMedia: usePendingMediaWithRealtime(),
    rsvps: useRSVPsWithRealtime(),
    stats: useStatsWithRealtime()
  };
}
