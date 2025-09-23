import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  Unsubscribe,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// Types for our data
export interface Invitation {
  id: string;
  guestName: string;
  guestRole: string;
  customMessage: string;
  invitationType: string;
  qrCode: string;
  isActive: boolean;
  rsvp: {
    status: 'pending' | 'attending' | 'not_attending';
    attendeeCount?: number;
    guestNames?: string[];
    email?: string;
    phone?: string;
    submittedAt?: any;
    ipAddress?: string;
    userAgent?: string;
  };
  openedAt?: any;
  createdAt: any;
  updatedAt: any;
}

export interface Album {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isFeatured: boolean;
  coverImage?: string;
  qrCode: string;
  createdAt: any;
  updatedAt: any;
}

export interface Media {
  id: string;
  albumId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  isApproved: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface RSVP {
  id: string;
  invitationId: string;
  qrCode: string;
  status: 'attending' | 'not_attending';
  attendeeCount?: number;
  guestNames?: string[];
  email?: string;
  phone?: string;
  submittedAt: any;
}

// Real-time listener management
class FirebaseRealtimeService {
  public listeners: Map<string, Unsubscribe> = new Map();
  private callbacks: Map<string, Set<(data: any) => void>> = new Map();

  // Generic listener method
  private addListener<T>(
    key: string,
    collectionName: string,
    constraints: any[] = [],
    callback: (data: T[]) => void
  ): Unsubscribe {
    // Remove existing listener if any
    this.removeListener(key);

    const q = query(
      collection(db, collectionName),
      ...constraints
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      
      callback(data);
      
      // Notify all callbacks for this key
      const callbacks = this.callbacks.get(key);
      if (callbacks) {
        callbacks.forEach(cb => cb(data));
      }
    });

    this.listeners.set(key, unsubscribe);
    return unsubscribe;
  }

  // Remove a specific listener
  removeListener(key: string): void {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
    }
  }

  // Remove all listeners
  removeAllListeners(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    this.callbacks.clear();
  }

  // Subscribe to callback for a specific key
  subscribe(key: string, callback: (data: any) => void): () => void {
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, new Set());
    }
    this.callbacks.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.callbacks.delete(key);
        }
      }
    };
  }

  // Invitations listeners
  listenToInvitations(callback: (invitations: Invitation[]) => void): Unsubscribe {
    return this.addListener<Invitation>(
      'invitations',
      'invitations',
      [orderBy('createdAt', 'desc')],
      callback
    );
  }

  listenToInvitationsByRole(role: string, callback: (invitations: Invitation[]) => void): Unsubscribe {
    return this.addListener<Invitation>(
      `invitations-role-${role}`,
      'invitations',
      [
        where('guestRole', '==', role),
        orderBy('createdAt', 'desc')
      ],
      callback
    );
  }

  listenToInvitationByQR(qrCode: string, callback: (invitation: Invitation | null) => void): Unsubscribe {
    return this.addListener<Invitation>(
      `invitation-qr-${qrCode}`,
      'invitations',
      [where('qrCode', '==', qrCode), limit(1)],
      (invitations) => callback(invitations[0] || null)
    );
  }

  // Albums listeners
  listenToAlbums(callback: (albums: Album[]) => void): Unsubscribe {
    return this.addListener<Album>(
      'albums',
      'albums',
      [orderBy('createdAt', 'desc')],
      callback
    );
  }

  listenToPublicAlbums(callback: (albums: Album[]) => void): Unsubscribe {
    return this.addListener<Album>(
      'albums-public',
      'albums',
      [
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      ],
      callback
    );
  }

  listenToFeaturedAlbums(callback: (albums: Album[]) => void): Unsubscribe {
    return this.addListener<Album>(
      'albums-featured',
      'albums',
      [
        where('isFeatured', '==', true),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      ],
      callback
    );
  }

  listenToAlbumByQR(qrCode: string, callback: (album: Album | null) => void): Unsubscribe {
    return this.addListener<Album>(
      `album-qr-${qrCode}`,
      'albums',
      [where('qrCode', '==', qrCode), limit(1)],
      (albums) => callback(albums[0] || null)
    );
  }

  // Media listeners
  listenToMediaByAlbum(albumId: string, callback: (media: Media[]) => void): Unsubscribe {
    return this.addListener<Media>(
      `media-album-${albumId}`,
      'media',
      [
        where('albumId', '==', albumId),
        where('isApproved', '==', true),
        orderBy('createdAt', 'desc')
      ],
      callback
    );
  }

  listenToAllMedia(callback: (media: Media[]) => void): Unsubscribe {
    return this.addListener<Media>(
      'media-all',
      'media',
      [orderBy('createdAt', 'desc')],
      callback
    );
  }

  listenToPendingMedia(callback: (media: Media[]) => void): Unsubscribe {
    return this.addListener<Media>(
      'media-pending',
      'media',
      [
        where('isApproved', '==', false),
        orderBy('createdAt', 'desc')
      ],
      callback
    );
  }

  // RSVP listeners
  listenToRSVPs(callback: (rsvps: RSVP[]) => void): Unsubscribe {
    return this.addListener<RSVP>(
      'rsvps',
      'rsvp',
      [orderBy('submittedAt', 'desc')],
      callback
    );
  }

  listenToRSVPByQR(qrCode: string, callback: (rsvp: RSVP | null) => void): Unsubscribe {
    return this.addListener<RSVP>(
      `rsvp-qr-${qrCode}`,
      'rsvp',
      [where('qrCode', '==', qrCode), limit(1)],
      (rsvps) => callback(rsvps[0] || null)
    );
  }

  listenToRSVPsByStatus(status: string, callback: (rsvps: RSVP[]) => void): Unsubscribe {
    return this.addListener<RSVP>(
      `rsvps-status-${status}`,
      'rsvp',
      [
        where('status', '==', status),
        orderBy('submittedAt', 'desc')
      ],
      callback
    );
  }

  // Stats listeners (aggregated data)
  listenToStats(callback: (stats: any) => void): Unsubscribe {
    // Aggregate detailed stats to match Host Dashboard expectations
    let invitationsList: Invitation[] = [];
    let albumsList: Album[] = [];
    let mediaList: Media[] = [];

    const buildAndEmit = () => {
      const invitationsTotal = invitationsList.length;
      const invitationsActive = invitationsList.filter((i) => i.isActive).length;
      const invitationsOpened = invitationsList.filter((i) => !!i.openedAt).length;

      const albumsTotal = albumsList.length;
      const albumsPublic = albumsList.filter((a) => a.isPublic).length;
      const albumsFeatured = albumsList.filter((a) => a.isFeatured).length;

      const mediaTotal = mediaList.length;
      const mediaImages = mediaList.filter((m) => m.fileType?.startsWith('image/')).length;
      const mediaVideos = mediaList.filter((m) => m.fileType?.startsWith('video/')).length;

      callback({
        invitations: {
          total: invitationsTotal,
          active: invitationsActive,
          opened: invitationsOpened,
        },
        albums: {
          totalAlbums: albumsTotal,
          publicAlbums: albumsPublic,
          featuredAlbums: albumsFeatured,
          totalMedia: mediaTotal,
        },
        media: {
          totalMedia: mediaTotal,
          imageCount: mediaImages,
          videoCount: mediaVideos,
        },
        lastUpdated: new Date().toISOString(),
      });
    };

    const unsubscribeInvitations = this.addListener<Invitation>(
      'stats-invitations',
      'invitations',
      [],
      (invitations) => {
        invitationsList = invitations;
        buildAndEmit();
      }
    );

    const unsubscribeAlbums = this.addListener<Album>(
      'stats-albums',
      'albums',
      [],
      (albums) => {
        albumsList = albums;
        buildAndEmit();
      }
    );

    const unsubscribeMedia = this.addListener<Media>(
      'stats-media',
      'media',
      [],
      (media) => {
        mediaList = media;
        buildAndEmit();
      }
    );

    return () => {
      unsubscribeInvitations();
      unsubscribeAlbums();
      unsubscribeMedia();
    };
  }
}

// Export singleton instance
export const firebaseRealtime = new FirebaseRealtimeService();

// Hook for React components
export function useFirebaseRealtime() {
  return firebaseRealtime;
}

// Utility functions for common patterns
export const realtimeUtils = {
  // Get a one-time snapshot of data
  async getSnapshot<T>(collectionName: string, constraints: any[] = []): Promise<T[]> {
    const { getDocs, query, collection } = await import('firebase/firestore');
    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
  },

  // Clear all listeners (useful for cleanup)
  clearAll: () => firebaseRealtime.removeAllListeners(),

  // Get active listener count
  getListenerCount: () => firebaseRealtime.listeners.size
};
