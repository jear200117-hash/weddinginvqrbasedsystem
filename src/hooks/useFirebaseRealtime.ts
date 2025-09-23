import { useEffect, useRef, useState, useCallback } from 'react';
import { firebaseRealtime, Invitation, Album, Media, RSVP } from '../lib/firebaseRealtime';

// Generic hook for Firebase real-time data
export function useFirebaseRealtimeData<T>(
  key: string,
  listenerFn: (callback: (data: T[]) => void) => () => void,
  initialData: T[] = []
) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const listenerFnRef = useRef(listenerFn);

  // Update the ref when listenerFn changes
  useEffect(() => {
    listenerFnRef.current = listenerFn;
  }, [listenerFn]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const unsubscribe = listenerFnRef.current((newData) => {
        setData(newData);
        setLoading(false);
      });

      unsubscribeRef.current = unsubscribe;

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
    }
  }, [key]); // Only depend on key, not listenerFn

  return { data, loading, error, mutate: setData };
}

// Specific hooks for different data types
export function useInvitations() {
  const listenerFn = useCallback(
    (callback: (data: Invitation[]) => void) => firebaseRealtime.listenToInvitations(callback),
    []
  );
  
  return useFirebaseRealtimeData<Invitation>(
    'invitations',
    listenerFn
  );
}

export function useInvitationsByRole(role: string) {
  const listenerFn = useCallback(
    (callback: (data: Invitation[]) => void) => firebaseRealtime.listenToInvitationsByRole(role, callback),
    [role]
  );
  
  return useFirebaseRealtimeData<Invitation>(
    `invitations-role-${role}`,
    listenerFn
  );
}

export function useInvitationByQR(qrCode: string) {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!qrCode) {
      setInvitation(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const unsubscribe = firebaseRealtime.listenToInvitationByQR(qrCode, (newInvitation) => {
        setInvitation(newInvitation);
        setLoading(false);
      });

      unsubscribeRef.current = unsubscribe;

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
    }
  }, [qrCode]);

  return { invitation, loading, error, mutate: setInvitation };
}

export function useAlbums() {
  const listenerFn = useCallback(
    (callback: (data: Album[]) => void) => firebaseRealtime.listenToAlbums(callback),
    []
  );
  
  return useFirebaseRealtimeData<Album>(
    'albums',
    listenerFn
  );
}

export function usePublicAlbums() {
  const listenerFn = useCallback(
    (callback: (data: Album[]) => void) => firebaseRealtime.listenToPublicAlbums(callback),
    []
  );
  
  return useFirebaseRealtimeData<Album>(
    'albums-public',
    listenerFn
  );
}

export function useFeaturedAlbums() {
  const listenerFn = useCallback(
    (callback: (data: Album[]) => void) => firebaseRealtime.listenToFeaturedAlbums(callback),
    []
  );
  
  return useFirebaseRealtimeData<Album>(
    'albums-featured',
    listenerFn
  );
}

export function useAlbumByQR(qrCode: string) {
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!qrCode) {
      setAlbum(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const unsubscribe = firebaseRealtime.listenToAlbumByQR(qrCode, (newAlbum) => {
        setAlbum(newAlbum);
        setLoading(false);
      });

      unsubscribeRef.current = unsubscribe;

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
    }
  }, [qrCode]);

  return { album, loading, error, mutate: setAlbum };
}

export function useMediaByAlbum(albumId: string) {
  const listenerFn = useCallback(
    (callback: (data: Media[]) => void) => firebaseRealtime.listenToMediaByAlbum(albumId, callback),
    [albumId]
  );
  
  return useFirebaseRealtimeData<Media>(
    `media-album-${albumId}`,
    listenerFn
  );
}

export function useAllMedia() {
  const listenerFn = useCallback(
    (callback: (data: Media[]) => void) => firebaseRealtime.listenToAllMedia(callback),
    []
  );
  
  return useFirebaseRealtimeData<Media>(
    'media-all',
    listenerFn
  );
}

export function usePendingMedia() {
  const listenerFn = useCallback(
    (callback: (data: Media[]) => void) => firebaseRealtime.listenToPendingMedia(callback),
    []
  );
  
  return useFirebaseRealtimeData<Media>(
    'media-pending',
    listenerFn
  );
}

export function useRSVPs() {
  const listenerFn = useCallback(
    (callback: (data: RSVP[]) => void) => firebaseRealtime.listenToRSVPs(callback),
    []
  );
  
  return useFirebaseRealtimeData<RSVP>(
    'rsvps',
    listenerFn
  );
}

export function useRSVPByQR(qrCode: string) {
  const [rsvp, setRsvp] = useState<RSVP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!qrCode) {
      setRsvp(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const unsubscribe = firebaseRealtime.listenToRSVPByQR(qrCode, (newRsvp) => {
        setRsvp(newRsvp);
        setLoading(false);
      });

      unsubscribeRef.current = unsubscribe;

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
    }
  }, [qrCode]);

  return { rsvp, loading, error, mutate: setRsvp };
}

export function useRSVPsByStatus(status: string) {
  const listenerFn = useCallback(
    (callback: (data: RSVP[]) => void) => firebaseRealtime.listenToRSVPsByStatus(status, callback),
    [status]
  );
  
  return useFirebaseRealtimeData<RSVP>(
    `rsvps-status-${status}`,
    listenerFn
  );
}

export function useStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const unsubscribe = firebaseRealtime.listenToStats((newStats) => {
        setStats(newStats);
        setLoading(false);
      });

      unsubscribeRef.current = unsubscribe;

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
    }
  }, []);

  return { stats, loading, error, mutate: setStats };
}

// Hook for cleanup
export function useFirebaseCleanup() {
  useEffect(() => {
    return () => {
      firebaseRealtime.removeAllListeners();
    };
  }, []);
}

