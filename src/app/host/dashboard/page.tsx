'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { invitationsAPI, albumsAPI, mediaAPI, authAPI, rsvpAPI, swrFetcher, rsvpAllKey, swrConfig, realtimeConfig, cacheUtils } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { getBestDisplayUrl, getFullSizeDisplayUrl } from '@/lib/googleDriveUtils';
import toast, { Toaster } from 'react-hot-toast';
import {
  Users,
  Mail,
  Image,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  BarChart3,
  Calendar,
  Heart,
  Upload,
  CheckSquare,
  Square,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Phone,
  User,
  QrCode,
  Copy,
  ExternalLink,
  Palette,
  QrCodeIcon
} from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import QRCodeConfig from '@/components/QRCodeConfig';
import { ENTOURAGE_CONFIG } from '@/config/entourageConfig';


interface Stats {
  invitations: {
    total: number;
    active: number;
    opened: number;
  };
  albums: {
    totalAlbums: number;
    publicAlbums: number;
    featuredAlbums: number;
    totalMedia: number;
  };
  media: {
    totalMedia: number;
    imageCount: number;
    videoCount: number;
  };
}

interface Invitation {
  _id: string;
  guestName: string;
  guestRole: string;
  customMessage: string;
  qrCode: string;
  qrCodePath?: string;
  isActive: boolean;
  isOpened: boolean;
  openedAt?: string;
  createdAt: string;
}

interface Album {
  _id: string;
  name: string;
  description: string;
  coverImage?: string;
  googleDriveFileId?: string;
  mediaCount: number;
  isPublic: boolean;
  isFeatured?: boolean;
  qrCode?: string;
  qrCodeUrl?: string;
  uploadUrl?: string;
  createdBy?: {
    _id: string;
    email: string;
  };
  createdAt: string;
}

export default function HostDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'invitations' | 'albums' | 'media'>('overview');
  const [albumViewMode, setAlbumViewMode] = useState<'grid' | 'detail'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);
  const [showEditAlbumModal, setShowEditAlbumModal] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [newInvitation, setNewInvitation] = useState({
    guestName: '',
    guestRole: 'General Guest',
    customMessage: '',
    invitationType: 'personalized'
  });
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);

  // Build unique entourage roles list from ENTOURAGE_CONFIG
  const entourageRoles = useMemo(() => {
    const rolesSet = new Set<string>();
    const deriveRoleFromTitle = (title: string) => {
      const t = title.trim();
      if (/^groomsmen$/i.test(t)) return 'Groomsman';
      if (/^bridesmaids$/i.test(t)) return 'Bridesmaid';
      if (/^flower girls$/i.test(t)) return 'Flower Girl';
      return t.replace(/s$/i, '');
    };
    const walk = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      if (node.members && Array.isArray(node.members)) {
        for (const m of node.members) {
          if (m && typeof m === 'object') {
            if (m.role && typeof m.role === 'string') {
              rolesSet.add(m.role);
            } else if (typeof node.title === 'string') {
              rolesSet.add(deriveRoleFromTitle(node.title));
            }
          }
        }
      }
      Object.values(node).forEach(walk);
    };
    walk(ENTOURAGE_CONFIG);
    // Always include General Guest at top
    return ['General Guest', ...Array.from(rolesSet).filter(r => r && r !== 'General Guest')];
  }, []);

  // Suggested custom messages
  const suggestedMessages = [
    "We would be honored to have you join us as we celebrate our special day. Please let us know if you'll be able to attend our wedding celebration.",
    "Your presence would make our wedding day even more special. We hope you can join us for this joyous occasion.",
    "We're excited to celebrate our love with family and friends. We would love for you to be part of our special day.",
    "Join us as we say 'I Do' and begin our new journey together. Your presence would mean the world to us.",
    "We're getting married and we want you there! Please let us know if you can celebrate with us on our special day.",
    "Your friendship means so much to us. We would be delighted if you could join us for our wedding celebration.",
    "We're tying the knot and we can't imagine celebrating without you. Please let us know if you can make it!",
    "Love is in the air and we're getting married! We hope you can join us for this beautiful celebration.",
    "We're extending this invitation to you and your family members. We would be delighted to have you all celebrate with us on our special day.",
    "Please join us with your family as we celebrate our union. Your presence and that of your loved ones would make our day complete.",
    "We warmly invite you and your family to be part of our wedding celebration. We hope you can all join us for this joyous occasion.",
    "This invitation extends to you and your family members. We would love to have you all there as we say 'I Do' and begin our new journey together.",
    "We're excited to celebrate with you and your family! Please let us know if you and your loved ones can join us on our special day.",
    "Your family has always been special to us, and we would be honored to have you all celebrate our wedding with us.",
    "We're getting married and we want you and your family there! Please let us know if you can all join us for this beautiful celebration.",
    "This invitation is for you and your family members. We can't imagine celebrating without you all being part of our special day."
  ];

  const handleSelectSuggestedMessage = (message: string) => {
    setNewInvitation({ ...newInvitation, customMessage: message });
  };

  const [newAlbum, setNewAlbum] = useState({
    name: '',
    description: '',
    isPublic: true,
    coverImage: undefined as string | undefined
  });

  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editAlbumData, setEditAlbumData] = useState({
    name: '',
    description: '',
    isPublic: true,
    isFeatured: false
  });
  const [isUpdatingAlbum, setIsUpdatingAlbum] = useState(false);

  // Album viewing state
  const [albumMedia, setAlbumMedia] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Media viewing state
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Bulk operations state
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkOperationLoading, setIsBulkOperationLoading] = useState(false);

  // Media management state
  const [allMedia, setAllMedia] = useState<any[]>([]);
  const [loadingAllMedia, setLoadingAllMedia] = useState(false);
  const [mediaFilters, setMediaFilters] = useState({
    album: 'all',
    type: 'all',
    approved: 'all'
  });
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaTotalPages, setMediaTotalPages] = useState(1);

  const router = useRouter();

  // RSVP state
  const [rsvpData, setRsvpData] = useState<any>(null);
  const [rsvpFilters, setRsvpFilters] = useState({
    status: 'all',
    role: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null);
  const [qrImageLoading, setQrImageLoading] = useState(false);
  const [qrConfig, setQrConfig] = useState({
    centerType: 'monogram' as 'none' | 'logo' | 'monogram',
    centerOptions: {
      monogram: 'M&E',
      fontSize: 40,
      fontFamily: 'Arial',
      textColor: '#000000',
      backgroundColor: '#ffffff',
      logoSize: 60,
      logoMargin: 10
    },
    size: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
  const [showQRConfig, setShowQRConfig] = useState(false);

  // SWR for RSVP data with real-time configuration (critical data)
  const rsvpKey = rsvpAllKey(rsvpFilters);
  const { data: swrRsvpData, isLoading: swrRsvpLoading } = useSWR(rsvpKey, swrFetcher, realtimeConfig);
  useEffect(() => {
    if (swrRsvpData) {
      setRsvpData(swrRsvpData);
      setCurrentPage(1);
    }
  }, [swrRsvpData]);

  // SWR for invitations list (socket-backed, no polling/no focus revalidate)
  const { data: swrInvites } = useSWR('/invitations?limit=10', swrFetcher, realtimeConfig);
  useEffect(() => {
    if (swrInvites?.invitations) {
      setInvitations(swrInvites.invitations);
    }
  }, [swrInvites]);

  // SWR for host albums list with optimized caching
  const { data: swrHostAlbums } = useSWR('/albums/host', swrFetcher, swrConfig);
  useEffect(() => {
    if (swrHostAlbums?.albums) {
      setAlbums(swrHostAlbums.albums);
    }
  }, [swrHostAlbums]);

  useEffect(() => {
    // Check if user is authenticated
    const token = Cookies.get('auth_token');
    if (!token) {
      router.push('/host/login');
      return;
    }

    fetchDashboardData();
  }, []);

  // Realtime subscriptions (Socket.IO)
  useEffect(() => {
    const socket = getSocket();
    const handleRSVP = () => {
      cacheUtils.clearRSVP();
      mutate(rsvpKey);
    };
    const handleInvChange = () => {
      cacheUtils.clearInvitations();
      mutate('/invitations?limit=10');
    };
    const handleAlbumsChange = () => {
      cacheUtils.clearAlbums();
      mutate('/albums/host');
    };
    const handleMediaChange = (payload?: any) => {
      // Invalidate album details if we have an album id
      cacheUtils.clearPattern('/albums/');
      mutate((key: string) => key?.startsWith('/albums/'));
    };

    socket.on('rsvp:updated', handleRSVP);
    socket.on('invitations:created', handleInvChange);
    socket.on('invitations:updated', handleInvChange);
    socket.on('invitations:deleted', handleInvChange);
    socket.on('albums:created', handleAlbumsChange);
    socket.on('albums:updated', handleAlbumsChange);
    socket.on('albums:deleted', handleAlbumsChange);
    socket.on('media:uploaded', handleMediaChange);
    socket.on('media:approved', handleMediaChange);
    socket.on('media:deleted', handleMediaChange);

    return () => {
      socket.off('rsvp:updated', handleRSVP);
      socket.off('invitations:created', handleInvChange);
      socket.off('invitations:updated', handleInvChange);
      socket.off('invitations:deleted', handleInvChange);
      socket.off('albums:created', handleAlbumsChange);
      socket.off('albums:updated', handleAlbumsChange);
      socket.off('albums:deleted', handleAlbumsChange);
      socket.off('media:uploaded', handleMediaChange);
      socket.off('media:approved', handleMediaChange);
      socket.off('media:deleted', handleMediaChange);
    };
  }, [rsvpKey]);



  // Keyboard shortcut for manual refresh
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeTab === 'invitations' && (event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        handleManualRefresh();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'media') {
      fetchAllMedia();
    }
  }, [activeTab, mediaFilters, mediaPage]);

  const fetchAllMedia = async () => {
    setLoadingAllMedia(true);
    try {
      const params: any = {
        page: mediaPage,
        limit: 20
      };

      if (mediaFilters.album !== 'all') params.album = mediaFilters.album;
      if (mediaFilters.type !== 'all') params.type = mediaFilters.type;
      if (mediaFilters.approved !== 'all') params.approved = mediaFilters.approved === 'true';

      const response = await mediaAPI.getAll(params);
      setAllMedia(response.media || []);
      setMediaTotalPages(response.totalPages || 1);
    } catch (error: any) {
      console.error('Fetch media error:', error);
      toast.error('Failed to load media');
    } finally {
      setLoadingAllMedia(false);
    }
  };

  const handleMediaFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...mediaFilters, [filterType]: value };
    setMediaFilters(newFilters);
    setMediaPage(1);
  };

  const handleDeleteMediaFromGallery = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }

    try {
      await mediaAPI.delete(mediaId);
      setAllMedia(prev => prev.filter(media => media._id !== mediaId));
      toast.success('Photo deleted successfully!');

      // Refresh stats
      fetchDashboardData();
    } catch (error: any) {
      console.error('Delete media error:', error);
      toast.error(error.message || 'Failed to delete photo');
    }
  };

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching fresh dashboard data...');
      const [invitationStats, albumStats, mediaStats, invitationsData, albumsData, rsvpDataResponse] = await Promise.all([
        invitationsAPI.getStats(),
        albumsAPI.getStats(),
        mediaAPI.getStats(),
        invitationsAPI.getAll({ limit: 10 }),
        albumsAPI.getHostAlbums(),
        Promise.resolve(null)
      ]);

      setStats({
        invitations: invitationStats.stats,
        albums: albumStats.stats,
        media: mediaStats.stats
      });

      setInvitations(invitationsData.invitations);
      setAlbums(albumsData.albums || []);
      if (rsvpDataResponse) setRsvpData(rsvpDataResponse);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRSVPData = async (filters = rsvpFilters) => {
    try {
      await mutate(rsvpAllKey(filters));
    } catch (error: any) {
      toast.error('Failed to load RSVP data');
    }
  };

  const handleManualRefresh = async () => {
    await fetchRSVPData();
    toast.success('RSVP data refreshed');
  };

  const handleViewQR = (invitation: any) => {
    setSelectedInvitation(invitation);
    setQrImageLoading(true);
    setShowQRModal(true);
  };

  const handleViewAlbumQR = (album: Album) => {
    setSelectedAlbum(album);
    setShowQRModal(true);
  };

  const handleCopyLink = async (qrCode: string, type: 'invitation' | 'album' = 'invitation') => {
    if (!qrCode) {
      toast.error('QR code not available');
      return;
    }

    const baseUrl = window.location.origin;
    const url = type === 'invitation'
      ? `${baseUrl}/invitation/${qrCode}`
      : `${baseUrl}/upload/${qrCode}`;

    try {
      await navigator.clipboard.writeText(url);
      toast.success(`${type === 'invitation' ? 'Invitation' : 'Upload'} link copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleOpenInvitation = (qrCode: string) => {
    if (!qrCode) {
      toast.error('QR code not available for this invitation');
      return;
    }

    const baseUrl = window.location.origin;
    const invitationUrl = `${baseUrl}/invitation/${qrCode}`;
    window.open(invitationUrl, '_blank');
  };

  const handleDownloadQR = (qrCodePath: string, guestName: string) => {
    if (!qrCodePath) {
      toast.error('QR code image not available for download');
      return;
    }

    const link = document.createElement('a');
    link.href = qrCodePath;
    link.download = `qr-code-${guestName.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded!');
  };

  // Pagination helpers
  const totalPages = Math.ceil((rsvpData?.invitations?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvitations = rsvpData?.invitations?.slice(startIndex, endIndex) || [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreateAlbum = async () => {
    if (isCreatingAlbum) return;
    if (!newAlbum.name.trim()) {
      toast.error('Please enter an album name');
      return;
    }

    console.log('Creating album with data:', newAlbum);
    console.log('Cover image type:', typeof newAlbum.coverImage);
    console.log('Cover image value:', newAlbum.coverImage);

    try {
      setIsCreatingAlbum(true);
      // Create album with QR configuration
      const albumData = {
        ...newAlbum,
        qrCenterType: qrConfig.centerType,
        qrCenterOptions: qrConfig.centerOptions
      };
      const response = await albumsAPI.create(albumData);
      console.log('Album creation response:', response);

      toast.success('Album created successfully!');

      // Close modal and reset form
      setShowCreateAlbumModal(false);
      setNewAlbum({ name: '', description: '', isPublic: true, coverImage: undefined });

    } catch (error: any) {
      console.error('Album creation error:', error);
      toast.error(error.response?.data?.error || 'Failed to create album');
    } finally {
      setIsCreatingAlbum(false);
    }
  };

  const handleEditAlbum = (album: Album) => {
    setEditingAlbum(album);
    setEditAlbumData({
      name: album.name,
      description: album.description || '',
      isPublic: album.isPublic,
      isFeatured: album.isFeatured || false
    });
    setShowEditAlbumModal(true);
  };

  const handleUpdateAlbum = async () => {
    if (isUpdatingAlbum || !editingAlbum) return;
    if (!editAlbumData.name.trim()) {
      toast.error('Please enter an album name');
      return;
    }

    setIsUpdatingAlbum(true);
    try {
      const response = await albumsAPI.update(editingAlbum._id, {
        name: editAlbumData.name.trim(),
        description: editAlbumData.description.trim(),
        isPublic: editAlbumData.isPublic,
        isFeatured: editAlbumData.isFeatured
      });

      // Update local state
      setAlbums(prev => prev.map(album =>
        album._id === editingAlbum._id
          ? { ...album, ...editAlbumData }
          : album
      ));

      toast.success('Album updated successfully!');
      setShowEditAlbumModal(false);
      setEditingAlbum(null);

      // Refresh data
      mutate('/albums/host');
    } catch (error: any) {
      console.error('Update album error:', error);
      toast.error(error.message || 'Failed to update album');
    } finally {
      setIsUpdatingAlbum(false);
    }
  };

  const handleUploadToAlbum = (album: Album) => {
    // TODO: Implement upload functionality
    toast.success(`Upload functionality for ${album.name} coming soon!`);
  };

  const handleViewAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setAlbumViewMode('detail');
  };

  const { data: swrDashboardAlbum, isLoading: swrDashAlbumLoading } = useSWR(
    selectedAlbum && albumViewMode === 'detail' ? `/albums/${selectedAlbum._id}` : null,
    swrFetcher,
    { revalidateOnFocus: true, dedupingInterval: 3000 }
  );

  useEffect(() => {
    if (swrDashboardAlbum?.media) {
      setAlbumMedia(swrDashboardAlbum.media || []);
      setLoadingMedia(false);
    } else if (selectedAlbum && albumViewMode === 'detail') {
      setLoadingMedia(swrDashAlbumLoading);
    }
  }, [swrDashboardAlbum, swrDashAlbumLoading, selectedAlbum, albumViewMode]);

  const handleBackToAlbums = () => {
    setAlbumViewMode('grid');
    setSelectedAlbum(null);
    setAlbumMedia([]);
  };

  const handleMediaClick = (media: any, index: number) => {
    setSelectedMedia(media);
    setCurrentMediaIndex(index);
    setShowMediaViewer(true);
  };

  const handleCloseMediaViewer = () => {
    setShowMediaViewer(false);
    setSelectedMedia(null);
  };

  const handlePreviousMedia = () => {
    if (currentMediaIndex > 0) {
      const newIndex = currentMediaIndex - 1;
      setCurrentMediaIndex(newIndex);
      setSelectedMedia(albumMedia[newIndex]);
    }
  };

  const handleNextMedia = () => {
    if (currentMediaIndex < albumMedia.length - 1) {
      const newIndex = currentMediaIndex + 1;
      setCurrentMediaIndex(newIndex);
      setSelectedMedia(albumMedia[newIndex]);
    }
  };

  // Bulk operations functions
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedMediaIds(new Set());
  };

  const toggleMediaSelection = (mediaId: string) => {
    setSelectedMediaIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mediaId)) {
        newSet.delete(mediaId);
      } else {
        newSet.add(mediaId);
      }
      return newSet;
    });
  };

  const selectAllMedia = () => {
    const allIds = new Set(albumMedia.map(media => media._id));
    setSelectedMediaIds(allIds);
  };

  const clearSelection = () => {
    setSelectedMediaIds(new Set());
  };

  const handleBulkDownload = async () => {
    if (selectedMediaIds.size === 0) return;

    setIsBulkOperationLoading(true);
    try {
      const selectedMedia = albumMedia.filter(media => selectedMediaIds.has(media._id));

      // Use a different approach for multiple files - open each in a new tab
      if (selectedMedia.length === 1) {
        // Single file - direct download
        const media = selectedMedia[0];
        const downloadUrl = media.googleDriveFileId
          ? `https://drive.google.com/uc?export=download&id=${media.googleDriveFileId}`
          : media.url;

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = media.originalName || media.filename || 'download';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Multiple files - open each in a new tab to bypass popup blocker
        selectedMedia.forEach((media, index) => {
          const downloadUrl = media.googleDriveFileId
            ? `https://drive.google.com/uc?export=download&id=${media.googleDriveFileId}`
            : media.url;

          // Open in new tab with a small delay to prevent blocking
          setTimeout(() => {
            window.open(downloadUrl, '_blank');
          }, index * 100);
        });
      }

      toast.success(`Downloaded ${selectedMediaIds.size} files`);
    } catch (error) {
      console.error('Bulk download error:', error);
      toast.error('Failed to download some files');
    } finally {
      setIsBulkOperationLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMediaIds.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedMediaIds.size} selected photos? This action cannot be undone.`)) {
      return;
    }

    setIsBulkOperationLoading(true);
    try {
      const selectedMedia = albumMedia.filter(media => selectedMediaIds.has(media._id));

      // Delete each selected media file
      for (const media of selectedMedia) {
        await mediaAPI.delete(media._id);
      }

      // Update local state
      setAlbumMedia(prev => prev.filter(media => !selectedMediaIds.has(media._id)));

      // Clear selection
      setSelectedMediaIds(new Set());

      toast.success(`Deleted ${selectedMediaIds.size} photos`);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete some photos');
    } finally {
      setIsBulkOperationLoading(false);
    }
  };

  // Keyboard navigation for media viewer
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showMediaViewer) {
        switch (e.key) {
          case 'Escape':
            handleCloseMediaViewer();
            break;
          case 'ArrowLeft':
            handlePreviousMedia();
            break;
          case 'ArrowRight':
            handleNextMedia();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showMediaViewer, currentMediaIndex, albumMedia.length]);

  const handleDeleteAlbum = async (albumId: string) => {
    if (confirm('Are you sure you want to delete this album? This action cannot be undone.')) {
      try {
        await albumsAPI.delete(albumId);

        // Immediately remove the album from local state
        setAlbums(prev => prev.filter(album => album._id !== albumId));

        // Update stats immediately
        setStats(prev => {
          if (!prev) return prev;

          const deletedAlbum = albums.find(album => album._id === albumId);
          if (!deletedAlbum) return prev;

          return {
            ...prev,
            albums: {
              ...prev.albums,
              totalAlbums: Math.max(0, (prev.albums.totalAlbums || 0) - 1),
              publicAlbums: Math.max(0, prev.albums.publicAlbums - (deletedAlbum.isPublic ? 1 : 0)),
              totalMedia: Math.max(0, (prev.albums.totalMedia || 0) - (deletedAlbum.mediaCount || 0))
            }
          };
        });

        toast.success('Album deleted successfully!');

        // Refresh data in background to ensure consistency
        setTimeout(() => {
          fetchDashboardData();
        }, 1000);

      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete album');
      }
    }
  };


  const handleCreateInvitation = async () => {
    if (!newInvitation.guestName.trim() || !newInvitation.customMessage.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreatingInvitation(true);
    try {
      // Create the invitation with QR configuration
      const invitationData = {
        ...newInvitation,
        qrCenterType: qrConfig.centerType,
        qrCenterOptions: qrConfig.centerOptions
      };
      const response = await invitationsAPI.create(invitationData);

      // Clear cache for invitations
      cacheUtils.clearInvitations();

      // Immediately add the new invitation to the local state
      if (response.invitation) {
        const newInvitationWithId = {
          ...response.invitation,
          _id: response.invitation._id || Date.now().toString(), // Fallback ID if not provided
          createdAt: new Date().toISOString(),
          qrCode: response.invitation.qrCode || `qr-${Date.now()}`,
          status: 'active'
        };

        // Update invitations list immediately
        setInvitations(prev => [newInvitationWithId, ...prev]);

        // Update stats immediately
        setStats(prev => {
          if (!prev) {
            // If no stats exist, create default stats
            return {
              invitations: {
                total: 1,
                active: 1,
                opened: 0
              },
              albums: {
                totalAlbums: 0,
                publicAlbums: 0,
                featuredAlbums: 0,
                totalMedia: 0
              },
              media: {
                totalMedia: 0,
                imageCount: 0,
                videoCount: 0
              }
            };
          }

          return {
            ...prev,
            invitations: {
              ...prev.invitations,
              total: (prev.invitations.total || 0) + 1,
              active: (prev.invitations.active || 0) + 1
            }
          };
        });

        console.log('New invitation added to state immediately:', newInvitationWithId);
      }

      toast.success('Invitation created successfully!');
      setShowCreateModal(false);
      setNewInvitation({
        guestName: '',
        guestRole: 'General Guest',
        customMessage: '',
        invitationType: 'personalized'
      });

      // Refresh data in background to ensure consistency
      setTimeout(() => {
        fetchDashboardData();
      }, 1000);

    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create invitation');
    } finally {
      setIsCreatingInvitation(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      router.push('/host/login');
    } catch (error) {
      Cookies.remove('auth_token');
      router.push('/host/login');
    }
  };

  const downloadQRCode = async (qrCode: string, guestName: string) => {
    try {
      // Create download link for QR code
      const link = document.createElement('a');
      link.href = `${process.env.NEXT_PUBLIC_API_URL || 'https://backendv2-nasy.onrender.com'}/uploads/qr-${qrCode}.png`;
      link.download = `${guestName.replace(/\s+/g, '_')}_invitation_qr.png`;
      link.click();
    } catch (error) {
      toast.error('Failed to download QR code');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="w-14 h-14 items-center overflow-hidden">
              <img
                src="/imgs/monogram-flower-black.png"
                alt="MJ & Erica Monogram"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setShowQRConfig(true)}
                className="bg-gradient-to-r from-[#667c93] to-[#84a2be] text-white px-3 sm:px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
              >
                <QrCodeIcon size={18} className="sm:w-5" />
                <span className="hidden sm:inline">QR Settings</span>
                <span className="sm:hidden">QR</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-[#667c93] to-[#84a2be] text-white px-3 sm:px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
              >
                <Plus size={18} className="sm:w-5" />
                <span className="hidden sm:inline">New Invitation</span>
                <span className="sm:hidden">Invite</span>
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <Settings size={18} className="sm:w-5" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Navigation Tabs */}
        <div className="mb-6 sm:mb-8">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'invitations', label: 'Invitations', icon: Mail },
                { id: 'albums', label: 'Albums', icon: Image },
                { id: 'media', label: 'Media', icon: Users },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === tab.id
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <tab.icon size={16} className="sm:w-[18px]" />
                  <span className="hidden xs:inline">{tab.label}</span>
                  <span className="xs:hidden sm:inline">{tab.id === 'overview' ? 'Overview' : tab.id === 'invitations' ? 'Invites' : tab.id === 'albums' ? 'Albums' : tab.id === 'pending-albums' ? 'Pending' : 'Media'}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6 sm:space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 sm:p-6 rounded-xl shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs sm:text-sm">Total Invitations</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.invitations.total}</p>
                  </div>
                  <Mail className="text-[#cba397] sm:w-8" size={24} />
                </div>
                <div className="mt-3 sm:mt-4">
                  <p className="text-xs sm:text-sm text-gray-600">
                    {stats.invitations.opened} opened ({Math.round((stats.invitations.opened / stats.invitations.total) * 100) || 0}%)
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-4 sm:p-6 rounded-xl shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs sm:text-sm">Albums</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.albums.totalAlbums}</p>
                  </div>
                  <Image className="text-blue-500 sm:w-8" size={24} />
                </div>
                <div className="mt-3 sm:mt-4">
                  <p className="text-xs sm:text-sm text-gray-600">
                    {stats.albums.publicAlbums} public, {stats.albums.featuredAlbums} featured
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-4 sm:p-6 rounded-xl shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs sm:text-sm">Total Media</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.media.totalMedia}</p>
                  </div>
                  <Users className="text-green-500 sm:w-8" size={24} />
                </div>
                <div className="mt-3 sm:mt-4">
                  <p className="text-sm text-gray-600">
                    {stats.media.imageCount} photos, {stats.media.videoCount} videos
                  </p>
                </div>
              </motion.div>

            </div>

            {/* Recent Invitations */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Invitations</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Guest</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">QR Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.slice(0, 5).map((invitation) => (
                      <tr key={invitation._id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-900 font-medium">{invitation.guestName}</td>
                        <td className="py-3 px-4">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                            {invitation.guestRole}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${invitation.isOpened
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {invitation.isOpened ? 'Opened' : 'Sent'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 text-sm font-medium">
                          {new Date(invitation.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {invitation.qrCode && (
                              <>
                                <button
                                  onClick={() => handleViewQR(invitation)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="View QR Code"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleCopyLink(invitation.qrCode)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="Copy Invitation Link"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleOpenInvitation(invitation.qrCode)}
                                  className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                  title="Open Invitation"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>

                                {invitation.qrCodePath && (
                                  <button
                                    onClick={() => handleViewQR(invitation)}
                                    className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                    title="Show QR Code"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Albums Management Tab */}
        {activeTab === 'albums' && (
          <div className="space-y-6">
            {albumViewMode === 'grid' ? (
              // Albums Grid View
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">Albums Management</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreateAlbumModal(true)}
                      className="bg-gradient-to-r from-[#667c93] to-[#84a2be] text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                    >
                      <Plus size={20} />
                      Create Album
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {albums.map((album) => (
                    <motion.div
                      key={album._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                      onClick={() => handleViewAlbum(album)}
                    >
                      <div className="h-32 sm:h-48 bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                        {album.coverImage ? (
                          <img
                            src={getBestDisplayUrl(album.coverImage, album.googleDriveFileId, 400)}
                            alt={album.name}
                            className="w-full h-full object-cover"
                            style={{
                              display: 'block',
                              backgroundColor: '#f9fafb',
                              opacity: '1',
                              visibility: 'visible'
                            }}
                            onError={(e) => {
                              console.error('Failed to load album cover:', album.coverImage);
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('Album cover loaded successfully:', album.name);
                            }}
                          />
                        ) : (
                          <Image className="text-rose-400 sm:w-16" size={32} />
                        )}
                      </div>
                      <div className="p-4 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{album.name}</h3>
                        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{album.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm text-gray-500">{album.mediaCount} photos</span>
                          <div className="flex gap-1 sm:gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewAlbumQR(album);
                              }}
                              className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50"
                              title="View QR Code"
                            >
                              <QrCode size={14} className="sm:w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAlbum(album);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                              title="Edit Album"
                            >
                              <Edit size={14} className="sm:w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAlbum(album._id);
                              }}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                              title="Delete Album"
                            >
                              <Trash2 size={14} className="sm:w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {albums.length === 0 && (
                  <div className="text-center py-12">
                    <Image className="text-gray-400 mx-auto mb-4" size={64} />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No albums yet</h3>
                    <p className="text-gray-500 mb-6">Create your first album to start organizing wedding memories!</p>
                    <button
                      onClick={() => setShowCreateAlbumModal(true)}
                      className="bg-gradient-to-r from-[#667c93] to-[#84a2be] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                    >
                      Create First Album
                    </button>
                  </div>
                )}
              </>
            ) : (
              // Album Detail View
              selectedAlbum && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Album Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleBackToAlbums}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        ← Back to Albums
                      </button>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{selectedAlbum.name}</h3>
                        <p className="text-gray-600">{selectedAlbum.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{selectedAlbum.mediaCount} items</span>
                          <span>Public: {selectedAlbum.isPublic ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {/* Selection Controls */}
                      {albumMedia.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={toggleSelectionMode}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isSelectionMode
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                          >
                            {isSelectionMode ? <CheckSquare size={16} /> : <Square size={16} />}
                            {isSelectionMode ? 'Exit Selection' : 'Select Photos'}
                          </button>

                          {isSelectionMode && (
                            <>
                              <button
                                onClick={selectAllMedia}
                                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                              >
                                Select All
                              </button>
                              <button
                                onClick={clearSelection}
                                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                              >
                                Clear
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => handleUploadToAlbum(selectedAlbum)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Upload size={16} />
                        Upload Media
                      </button>
                      <button
                        onClick={() => handleEditAlbum(selectedAlbum)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Bulk Action Controls */}
                  {isSelectionMode && selectedMediaIds.size > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {selectedMediaIds.size} photos selected
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleBulkDownload}
                            disabled={isBulkOperationLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            <Download size={16} />
                            Download
                          </button>
                          <button
                            onClick={handleBulkDelete}
                            disabled={isBulkOperationLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Album Content */}
                  {loadingMedia ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cba397]"></div>
                    </div>
                  ) : albumMedia.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {albumMedia.map((media, index) => (
                        <div
                          key={media._id || index}
                          className={`relative group ${isSelectionMode ? 'cursor-default' : 'cursor-pointer'}`}
                          onClick={() => isSelectionMode ? toggleMediaSelection(media._id) : handleMediaClick(media, index)}
                        >
                          {media.mediaType === 'image' ? (
                            <div
                              className="w-full rounded-lg overflow-hidden"
                              style={{
                                aspectRatio: '1/1',
                                minHeight: '200px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                position: 'relative'
                              }}
                            >
                              <img
                                src={getBestDisplayUrl(media.thumbnailUrl || media.url, media.googleDriveFileId, 300)}
                                alt={media.originalName || 'Album media'}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  display: 'block',
                                  backgroundColor: '#f9fafb',
                                  opacity: '1',
                                  visibility: 'visible',
                                  filter: 'none',
                                  transform: 'none',
                                  position: 'relative',
                                  zIndex: 1
                                }}
                                onError={(e) => {
                                  console.error('Failed to load image:', media.url);
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.style.backgroundColor = '#dc2626';
                                  target.style.border = '2px solid #dc2626';
                                  target.alt = 'Image failed to load';
                                }}
                                onLoad={(e) => {
                                  console.log('Image loaded successfully:', media.originalName);
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.style.backgroundColor = 'transparent';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="aspect-square w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center rounded-lg relative overflow-hidden">
                              <div className="w-full h-full relative">
                                <video
                                  src={media.url}
                                  className="w-full h-full object-cover rounded-lg"
                                  preload="metadata"
                                  muted
                                  playsInline
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
                                  <div className="bg-white bg-opacity-90 rounded-full p-3 shadow-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Selection Checkbox */}
                          {isSelectionMode && (
                            <div className="absolute top-2 left-2 z-10">
                              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${selectedMediaIds.has(media._id)
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-300'
                                }`}>
                                {selectedMediaIds.has(media._id) && <Check size={16} />}
                              </div>
                            </div>
                          )}

                          {/* Media Info Overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-end rounded-lg">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 w-full">
                              <div className="bg-black bg-opacity-70 text-white text-xs p-2 rounded">
                                <p className="font-medium">{media.originalName}</p>
                                {media.uploadedBy && (
                                  <p className="opacity-75">By {media.uploadedBy}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Click to view indicator */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-white bg-opacity-90 rounded-full p-2 shadow-lg">
                              <Eye className="text-gray-700" size={16} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Image className="text-gray-400 mx-auto mb-4" size={64} />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No media in this album</h3>
                      <p className="text-gray-500 mb-6">This album doesn't contain any photos or videos yet.</p>
                      <button
                        onClick={() => handleUploadToAlbum(selectedAlbum)}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                      >
                        <Upload size={20} />
                        Upload First Media
                      </button>
                    </div>
                  )}

                  {/* Footer Info */}
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <strong>Album Statistics:</strong> {albumMedia.length} total files
                      {selectedAlbum.createdBy && (
                        <span className="ml-4">
                          <strong>Created by:</strong> {selectedAlbum.createdBy.email}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            )}
          </div>
        )}

        {/* Media Management Tab */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Media Gallery</h3>
              <div className="text-sm text-gray-600">
                {allMedia.length} photos and videos
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>

                <select
                  value={mediaFilters.album}
                  onChange={(e) => handleMediaFilterChange('album', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="all">All Albums</option>
                  {albums.map((album) => (
                    <option key={album._id} value={album._id}>{album.name}</option>
                  ))}
                </select>

                <select
                  value={mediaFilters.type}
                  onChange={(e) => handleMediaFilterChange('type', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                </select>

                <select
                  value={mediaFilters.approved}
                  onChange={(e) => handleMediaFilterChange('approved', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="true">Approved</option>
                  <option value="false">Pending</option>
                </select>
              </div>

              {/* Media Gallery */}
              {loadingAllMedia ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cba397]"></div>
                </div>
              ) : allMedia.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {allMedia.map((media) => (
                    <div
                      key={media._id}
                      className="relative group cursor-pointer"
                    >
                      {media.mediaType === 'image' ? (
                        <div
                          className="w-full rounded-lg overflow-hidden"
                          style={{
                            aspectRatio: '1/1',
                            minHeight: '200px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            position: 'relative'
                          }}
                        >
                          <img
                            src={getBestDisplayUrl(media.thumbnailUrl || media.url, media.googleDriveFileId, 300)}
                            alt={media.originalName || 'Media'}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                              backgroundColor: '#f9fafb',
                              opacity: '1',
                              visibility: 'visible'
                            }}
                            onError={(e) => {
                              console.error('Failed to load image:', media.url);
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.backgroundColor = '#dc2626';
                              target.style.border = '2px solid #dc2626';
                              target.alt = 'Image failed to load';
                            }}
                            onLoad={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.backgroundColor = 'transparent';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="aspect-square w-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center rounded-lg relative overflow-hidden">
                          <div className="w-full h-full relative">
                            <video
                              src={media.url}
                              className="w-full h-full object-cover rounded-lg"
                              preload="metadata"
                              muted
                              playsInline
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
                              <div className="bg-white bg-opacity-90 rounded-full p-3 shadow-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Media Info Overlay */}
                      <div className="absolute inset-0 bg-transparent bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-end rounded-lg">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 w-full">
                          <div className="bg-black text-white text-xs p-2 rounded">
                            <p className="font-medium">{media.originalName}</p>
                            {media.uploadedBy && (
                              <p className="opacity-75">By {media.uploadedBy}</p>
                            )}
                            {media.album?.name && (
                              <p className="opacity-75">Album: {media.album.name}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(media.url, '_blank');
                          }}
                          className="bg-white bg-opacity-90 text-gray-700 rounded-full p-2 shadow-lg hover:bg-opacity-100 transition-colors"
                          title="View Full Size"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const downloadUrl = media.googleDriveFileId
                              ? `https://drive.google.com/uc?export=download&id=${media.googleDriveFileId}`
                              : media.url;
                            const link = document.createElement('a');
                            link.href = downloadUrl;
                            link.download = media.originalName || 'download';
                            link.click();
                          }}
                          className="bg-white bg-opacity-90 text-gray-700 rounded-full p-2 shadow-lg hover:bg-opacity-100 transition-colors"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMediaFromGallery(media._id);
                          }}
                          className="bg-red-500 bg-opacity-90 text-white rounded-full p-2 shadow-lg hover:bg-opacity-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Image className="text-gray-400 mx-auto mb-4" size={64} />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No media found</h3>
                  <p className="text-gray-500">No photos or videos match your current filters.</p>
                </div>
              )}

              {/* Pagination */}
              {mediaTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setMediaPage(Math.max(1, mediaPage - 1))}
                    disabled={mediaPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {mediaPage} of {mediaTotalPages}
                  </span>
                  <button
                    onClick={() => setMediaPage(Math.min(mediaTotalPages, mediaPage + 1))}
                    disabled={mediaPage === mediaTotalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invitations Management Tab with RSVP */}
        {activeTab === 'invitations' && (
          <div className="space-y-6">
            {/* RSVP Stats Cards */}
            {rsvpData?.stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <motion.div
                  className="bg-white rounded-xl shadow-lg p-6 text-center border-l-4 border-blue-500"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="text-3xl font-bold text-blue-600">{rsvpData.stats.total}</div>
                  <div className="text-sm text-gray-600">Total Invitations</div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-xl shadow-lg p-6 text-center border-l-4 border-green-500"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-3xl font-bold text-green-600">{rsvpData.stats.attending}</div>
                  <div className="text-sm text-gray-600">Attending</div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-xl shadow-lg p-6 text-center border-l-4 border-red-500"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-3xl font-bold text-red-600">{rsvpData.stats.notAttending}</div>
                  <div className="text-sm text-gray-600">Not Attending</div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-xl shadow-lg p-6 text-center border-l-4 border-yellow-500"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-3xl font-bold text-yellow-600">{rsvpData.stats.pending}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </motion.div>
              </div>
            )}

            {/* RSVP Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>

                <select
                  value={rsvpFilters.status}
                  onChange={(e) => {
                    const newFilters = { ...rsvpFilters, status: e.target.value };
                    setRsvpFilters(newFilters);
                    fetchRSVPData(newFilters);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="attending">Attending</option>
                  <option value="not_attending">Not Attending</option>
                </select>

                <select
                  value={rsvpFilters.role}
                  onChange={(e) => {
                    const newFilters = { ...rsvpFilters, role: e.target.value };
                    setRsvpFilters(newFilters);
                    fetchRSVPData(newFilters);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  {entourageRoles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Search guests..."
                  value={rsvpFilters.search}
                  onChange={(e) => {
                    const newFilters = { ...rsvpFilters, search: e.target.value };
                    setRsvpFilters(newFilters);
                    fetchRSVPData(newFilters);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              {/* RSVP List */}
              <div className="space-y-4">
                {currentInvitations.map((invitation: any) => (
                  <motion.div
                    key={invitation._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {invitation.rsvp.status === 'attending' && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {invitation.rsvp.status === 'not_attending' && (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          {invitation.rsvp.status === 'pending' && (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">{invitation.guestName}</h4>
                            <p className="text-sm text-gray-500">{invitation.guestRole}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {invitation.rsvp.status === 'attending' && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{invitation.rsvp.attendeeCount}</span> guest{invitation.rsvp.attendeeCount !== 1 ? 's' : ''}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {invitation.qrCode && (
                            <>
                              <button
                                onClick={() => handleViewQR(invitation)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View QR Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleCopyLink(invitation.qrCode)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Copy Invitation Link"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenInvitation(invitation.qrCode)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Open Invitation"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>

                              {invitation.qrCodePath && (
                                <button
                                  onClick={() => handleViewQR(invitation)}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="Show QR Code"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        <div className="text-right">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invitation.rsvp.status === 'attending'
                            ? 'bg-green-100 text-green-800'
                            : invitation.rsvp.status === 'not_attending'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {invitation.rsvp.status === 'attending' ? 'Attending' :
                              invitation.rsvp.status === 'not_attending' ? 'Not Attending' : 'Pending'}
                          </div>
                          {invitation.rsvp.respondedAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(invitation.rsvp.respondedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>



                    {invitation.rsvp.guestNames && invitation.rsvp.guestNames.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-700">Guest Name:</span>
                          <span className="text-gray-600">{invitation.rsvp.guestNames[0]}</span>
                        </div>
                      </div>
                    )}

                    {(invitation.rsvp.email || invitation.rsvp.phone) && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-700">Contact Information</span>
                        </div>
                        <div className="space-y-2">
                          {invitation.rsvp.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-green-500" />
                              <span className="font-medium text-gray-700">Email:</span>
                              <span className="text-gray-600">{invitation.rsvp.email}</span>
                            </div>
                          )}
                          {invitation.rsvp.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-purple-500" />
                              <span className="font-medium text-gray-700">Phone:</span>
                              <span className="text-gray-600">{invitation.rsvp.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, rsvpData?.invitations?.length || 0)} of {rsvpData?.invitations?.length || 0} invitations
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm rounded-lg transition-colors ${currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                              }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {rsvpData?.invitations?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No RSVP responses found for the current filters.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Other tabs would go here - for brevity, showing overview only */}
        {activeTab !== 'overview' && activeTab !== 'albums' && activeTab !== 'invitations' && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
            </h3>
            <p className="text-gray-600">
              This section will contain detailed management for {activeTab}.
            </p>
          </div>
        )}
      </div>

      {/* Create Album Modal */}
      {showCreateAlbumModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Create New Album</h3>

            {/* QR Configuration Indicator */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Palette className="w-4 h-4" />
                <span className="font-medium">QR Code Style:</span>
                <span className="capitalize">
                  {qrConfig.centerType === 'none' ? 'Plain QR Code' :
                    qrConfig.centerType === 'logo' ? 'With Logo' :
                      `With Monogram (${qrConfig.centerOptions.monogram})`}
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                This album will use your current QR configuration. Change it in QR Settings if needed.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Album Name *
                </label>
                <input
                  type="text"
                  value={newAlbum.name}
                  onChange={(e) => setNewAlbum({ ...newAlbum, name: e.target.value })}
                  placeholder="Enter album name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newAlbum.description}
                  onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                  placeholder="Enter album description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newAlbum.isPublic}
                    onChange={(e) => setNewAlbum({ ...newAlbum, isPublic: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Public Album (guests can view and upload)</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Photo (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 text-center hover:border-rose-400 transition-colors">
                  {newAlbum.coverImage ? (
                    <div className="space-y-2">
                      <img
                        src={newAlbum.coverImage}
                        alt="Cover preview"
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => setNewAlbum({ ...newAlbum, coverImage: undefined })}
                        className="text-xs sm:text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto text-gray-400 sm:w-6" size={20} />
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          <span className="text-rose-500 font-medium">Click to upload</span> cover photo
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // For now, we'll use a placeholder. In production, you'd upload to Cloudinary
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setNewAlbum({ ...newAlbum, coverImage: e.target?.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="host-cover-photo-upload"
                      />
                      <label
                        htmlFor="host-cover-photo-upload"
                        className="cursor-pointer inline-block px-3 py-1 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors text-sm"
                      >
                        Choose File
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 mt-6">
              <button
                onClick={() => setShowCreateAlbumModal(false)}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAlbum}
                disabled={isCreatingAlbum}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-white text-sm sm:text-base ${isCreatingAlbum ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#667c93] to-[#84a2be] hover:shadow-lg'}`}
              >
                {isCreatingAlbum ? 'Creating...' : 'Create Album'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Album Modal */}
      {showEditAlbumModal && editingAlbum && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-gray-200"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Album</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Album Name *
                </label>
                <input
                  type="text"
                  value={editAlbumData.name}
                  onChange={(e) => setEditAlbumData({ ...editAlbumData, name: e.target.value })}
                  placeholder="Enter album name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editAlbumData.description}
                  onChange={(e) => setEditAlbumData({ ...editAlbumData, description: e.target.value })}
                  placeholder="Enter album description (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent text-gray-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsPublic"
                    checked={editAlbumData.isPublic}
                    onChange={(e) => setEditAlbumData({ ...editAlbumData, isPublic: e.target.checked })}
                    className="h-4 w-4 text-[#84a2be] focus:ring-[#84a2be] border-gray-300 rounded"
                  />
                  <label htmlFor="editIsPublic" className="ml-2 block text-sm text-gray-900">
                    Public Album
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsFeatured"
                    checked={editAlbumData.isFeatured}
                    onChange={(e) => setEditAlbumData({ ...editAlbumData, isFeatured: e.target.checked })}
                    className="h-4 w-4 text-[#84a2be] focus:ring-[#84a2be] border-gray-300 rounded"
                  />
                  <label htmlFor="editIsFeatured" className="ml-2 block text-sm text-gray-900">
                    Featured Album
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditAlbumModal(false);
                  setEditingAlbum(null);
                }}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAlbum}
                disabled={isUpdatingAlbum}
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg text-white text-sm sm:text-base ${isUpdatingAlbum ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#667c93] to-[#84a2be] hover:shadow-lg'}`}
              >
                {isUpdatingAlbum ? 'Updating...' : 'Update Album'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Invitation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Invitation</h3>

            {/* QR Configuration Indicator */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Palette className="w-4 h-4" />
                <span className="font-medium">QR Code Style:</span>
                <span className="capitalize">
                  {qrConfig.centerType === 'none' ? 'Plain QR Code' :
                    qrConfig.centerType === 'logo' ? 'With Logo' :
                      `With Monogram (${qrConfig.centerOptions.monogram})`}
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                This invitation will use your current QR configuration. Change it in QR Settings if needed.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guest Name *
                </label>
                <input
                  type="text"
                  value={newInvitation.guestName}
                  onChange={(e) => setNewInvitation({ ...newInvitation, guestName: e.target.value })}
                  placeholder="Enter guest name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guest Role
                </label>
                <select
                  value={newInvitation.guestRole}
                  onChange={(e) => setNewInvitation({ ...newInvitation, guestRole: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent text-gray-900 font-medium"
                >
                  {entourageRoles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Message *
                </label>
                <div className="relative">
                  <textarea
                    value={newInvitation.customMessage}
                    onChange={(e) => setNewInvitation({ ...newInvitation, customMessage: e.target.value })}
                    placeholder="Enter personalized message for the guest"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent text-gray-900 font-medium"
                    required
                    maxLength={1000}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-1 rounded">
                    {newInvitation.customMessage.length}/1000
                  </div>
                </div>

                {/* Suggested Messages */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Suggested messages:</p>
                    <button
                      type="button"
                      onClick={() => setNewInvitation({ ...newInvitation, customMessage: '' })}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                    {suggestedMessages.map((message, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectSuggestedMessage(message)}
                        className="text-left p-2 text-xs bg-white hover:bg-blue-50 rounded border border-gray-200 transition-colors hover:border-blue-300"
                      >
                        {message.length > 80 ? `${message.substring(0, 80)}...` : message}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invitation Type
                </label>
                <select
                  value={newInvitation.invitationType}
                  onChange={(e) => setNewInvitation({ ...newInvitation, invitationType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent text-gray-900 font-medium"
                >
                  <option value="personalized">Personalized</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isCreatingInvitation}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvitation}
                disabled={isCreatingInvitation || !newInvitation.guestName.trim() || !newInvitation.customMessage.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#667c93] to-[#84a2be] text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreatingInvitation ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  'Create Invitation'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (selectedInvitation || selectedAlbum) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => {
              setShowQRModal(false);
              setSelectedInvitation(null);
              setSelectedAlbum(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedInvitation ? 'Invitation QR Code' : 'Album Upload QR Code'}
                </h3>
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    setSelectedInvitation(null);
                    setSelectedAlbum(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedInvitation ? (
                    <>
                      <h4 className="font-medium text-gray-900 mb-2">{selectedInvitation.guestName}</h4>
                      <p className="text-sm text-gray-600 mb-4">{selectedInvitation.guestRole}</p>
                    </>
                  ) : selectedAlbum ? (
                    <>
                      <h4 className="font-medium text-gray-900 mb-2">{selectedAlbum.name}</h4>
                      <p className="text-sm text-gray-600 mb-4">Upload photos to this album</p>
                    </>
                  ) : null}

                  {/* QR Code Display */}
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                    <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      {selectedInvitation?.qrCodePath ? (
                        <img
                          src={selectedInvitation.qrCodePath}
                          alt={`QR Code for ${selectedInvitation.guestName}`}
                          className="w-full h-full object-contain p-2"
                          onLoad={() => setQrImageLoading(false)}
                          referrerPolicy="no-referrer"
                        />
                      ) : selectedAlbum?.qrCodeUrl ? (
                        <img
                          src={selectedAlbum.qrCodeUrl}
                          alt={`QR Code for ${selectedAlbum.name}`}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <QrCode className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">QR Code for</p>
                          {(selectedInvitation?.qrCode || selectedAlbum?.qrCode) ? (
                            <p className="text-xs font-mono break-all">
                              {selectedInvitation?.qrCode || selectedAlbum?.qrCode}
                            </p>
                          ) : (
                            <p className="text-xs text-red-500">QR Code not available</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {selectedInvitation ? 'Scan to view invitation' : 'Scan to upload photos'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleCopyLink(
                      selectedInvitation?.qrCode || selectedAlbum?.qrCode || '',
                      selectedInvitation ? 'invitation' : 'album'
                    )}
                    disabled={!selectedInvitation?.qrCode && !selectedAlbum?.qrCode}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Copy className="w-4 h-4" />
                    Copy {selectedInvitation ? 'Invitation' : 'Upload'} Link
                  </button>

                  {selectedInvitation && (
                    <button
                      onClick={() => handleOpenInvitation(selectedInvitation.qrCode)}
                      disabled={!selectedInvitation.qrCode}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Invitation
                    </button>
                  )}

                  {selectedInvitation?.qrCodePath && (
                    <button
                      onClick={() => handleDownloadQR(selectedInvitation.qrCodePath, selectedInvitation.guestName)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download QR Code
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Configuration Modal */}
      <AnimatePresence>
        {showQRConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowQRConfig(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Palette className="w-6 h-6 text-purple-600" />
                    QR Code Configuration
                  </h3>
                  <button
                    onClick={() => setShowQRConfig(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <QRCodeConfig
                  onConfigChange={setQrConfig}
                  initialConfig={qrConfig}
                  showPreview={true}
                />

                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowQRConfig(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowQRConfig(false);
                      toast.success('QR configuration saved!');
                    }}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Viewer */}
      <AnimatePresence>
        {showMediaViewer && selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
            onClick={handleCloseMediaViewer}
          >
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {/* Close Button */}
              <button
                onClick={handleCloseMediaViewer}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
              >
                <X size={24} />
              </button>

              {/* Previous Button */}
              {currentMediaIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviousMedia();
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-3"
                >
                  <ChevronLeft size={32} />
                </button>
              )}

              {/* Next Button */}
              {currentMediaIndex < albumMedia.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextMedia();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-3"
                >
                  <ChevronRight size={32} />
                </button>
              )}

              {/* Media Content */}
              <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                {selectedMedia.mediaType === 'image' ? (
                  <img
                    src={getFullSizeDisplayUrl(selectedMedia.url, selectedMedia.googleDriveFileId)}
                    alt={selectedMedia.originalName}
                    className="max-w-none max-h-none w-auto h-auto object-contain"
                    style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                  />
                ) : (
                  <video
                    src={selectedMedia.url}
                    controls
                    autoPlay
                    className="max-w-none max-h-none w-auto h-auto"
                    style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                  />
                )}
              </div>

              {/* Media Info */}
              <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 rounded-lg p-4 max-w-md">
                <h3 className="font-semibold text-lg mb-2">{selectedMedia.originalName}</h3>
                <div className="space-y-1 text-sm">
                  {selectedMedia.uploadedBy && (
                    <p className="opacity-90">Uploaded by: {selectedMedia.uploadedBy}</p>
                  )}
                  <p className="opacity-90">
                    Type: {selectedMedia.mediaType === 'image' ? 'Image' : 'Video'}
                  </p>
                  <p className="opacity-90">
                    {currentMediaIndex + 1} of {albumMedia.length}
                  </p>
                  {selectedMedia.createdAt && (
                    <p className="opacity-75">
                      Uploaded: {new Date(selectedMedia.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Navigation Indicators */}
              <div className="absolute bottom-4 right-4 text-white bg-black bg-opacity-50 rounded-lg p-2">
                <div className="flex gap-1">
                  {albumMedia.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full cursor-pointer ${index === currentMediaIndex ? 'bg-white' : 'bg-gray-500'
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentMediaIndex(index);
                        setSelectedMedia(albumMedia[index]);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Keyboard Instructions */}
              <div className="absolute top-4 left-4 text-white bg-black bg-opacity-50 rounded-lg p-3 text-sm">
                <div className="space-y-1">
                  <p><kbd className="bg-gray-700 px-2 py-1 rounded text-xs">ESC</kbd> Close</p>
                  <p><kbd className="bg-gray-700 px-2 py-1 rounded text-xs">←</kbd> Previous</p>
                  <p><kbd className="bg-gray-700 px-2 py-1 rounded text-xs">→</kbd> Next</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
