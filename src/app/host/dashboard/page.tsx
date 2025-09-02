'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invitationsAPI, albumsAPI, mediaAPI, authAPI, rsvpAPI } from '@/lib/api';
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
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Phone,
  User,
  RefreshCw,
  QrCode,
  Copy,
  ExternalLink
} from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';


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
    approvedMedia: number;
    pendingMedia: number;
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
  mediaCount: number;
  isPublic: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdBy?: {
    _id: string;
    email: string;
  };
  creatorInfo?: {
    type: 'user' | 'guest';
    email: string;
  };
  createdAt: string;
}

export default function HostDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'invitations' | 'albums' | 'pending-albums' | 'media'>('overview');
  const [albumViewMode, setAlbumViewMode] = useState<'grid' | 'detail'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [pendingAlbums, setPendingAlbums] = useState<Album[]>([]);
  const [newInvitation, setNewInvitation] = useState({
    guestName: '',
    guestRole: 'General Guest',
    customMessage: '',
    invitationType: 'personalized'
  });
  const [newAlbum, setNewAlbum] = useState({
    name: '',
    description: '',
    isPublic: true,
    coverImage: undefined as string | undefined
  });
  
  // Album viewing state
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumMedia, setAlbumMedia] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  
  // Media viewing state
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  const router = useRouter();

  // RSVP state
  const [rsvpData, setRsvpData] = useState<any>(null);
  const [rsvpFilters, setRsvpFilters] = useState({
    status: 'all',
    role: 'all',
    search: ''
  });
  const [isRefreshingRSVP, setIsRefreshingRSVP] = useState(false);
  const [lastRSVPRefresh, setLastRSVPRefresh] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null);
  const [qrImageLoading, setQrImageLoading] = useState(false);

  // Add request caching and debouncing
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const CACHE_DURATION = 30000; // 30 seconds cache

  useEffect(() => {
    // Check if user is authenticated
    const token = Cookies.get('auth_token');
    if (!token) {
      router.push('/host/login');
      return;
    }
    
    fetchDashboardData();
  }, []);



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

  const fetchDashboardData = async (forceRefresh = false) => {
    const now = Date.now();
    
    // Check if we should use cached data
    if (!forceRefresh && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('Using cached dashboard data');
      return;
    }

    try {
      console.log('Fetching fresh dashboard data...');
      const [invitationStats, albumStats, mediaStats, invitationsData, albumsData, pendingAlbumsData, rsvpDataResponse] = await Promise.all([
        invitationsAPI.getStats(),
        albumsAPI.getStats(),
        mediaAPI.getStats(),
        invitationsAPI.getAll({ limit: 10 }),
        albumsAPI.getAll(),
        albumsAPI.getPending(),
        rsvpAPI.getAll()
      ]);

      setStats({
        invitations: invitationStats.stats,
        albums: albumStats.stats,
        media: mediaStats.stats
      });
      
      setInvitations(invitationsData.invitations);
      setAlbums(albumsData.albums || []);
      setPendingAlbums(pendingAlbumsData.pendingAlbums || []);
      setRsvpData(rsvpDataResponse);
      setLastFetchTime(now);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRSVPData = async (filters = rsvpFilters) => {
    try {
      setIsRefreshingRSVP(true);
      const response = await rsvpAPI.getAll(filters);
      setRsvpData(response);
      setLastRSVPRefresh(Date.now());
      setCurrentPage(1); // Reset to first page when filters change
    } catch (error: any) {
      toast.error('Failed to load RSVP data');
    } finally {
      setIsRefreshingRSVP(false);
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

  const handleCopyLink = async (qrCode: string) => {
    if (!qrCode) {
      toast.error('QR code not available for this invitation');
      return;
    }
    
    const baseUrl = window.location.origin;
    const invitationUrl = `${baseUrl}/invitation/${qrCode}`;
    
    try {
      await navigator.clipboard.writeText(invitationUrl);
      toast.success('Invitation link copied to clipboard!');
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
    if (!newAlbum.name.trim()) {
      toast.error('Please enter an album name');
      return;
    }

    console.log('Creating album with data:', newAlbum);
    console.log('Cover image type:', typeof newAlbum.coverImage);
    console.log('Cover image value:', newAlbum.coverImage);

    try {
      const response = await albumsAPI.create(newAlbum);
      console.log('Album creation response:', response);
      
      // Immediately add the new album to the local state
      if (response.album) {
        const newAlbumWithId = {
          ...response.album,
          _id: response.album._id || Date.now().toString(),
          createdAt: new Date().toISOString(),
          mediaCount: 0,
          approvalStatus: 'approved' as const,
          createdBy: {
            _id: 'host', // Since this is created by host
            email: 'host@wedding.com'
          }
        };
        
        // Update albums list immediately
        setAlbums(prev => [newAlbumWithId, ...prev]);
        
        // Update stats immediately
        setStats(prev => {
          if (!prev) {
            return {
              invitations: {
                total: 0,
                active: 0,
                opened: 0
              },
              albums: {
                totalAlbums: 1,
                publicAlbums: newAlbumWithId.isPublic ? 1 : 0,
                featuredAlbums: 0,
                totalMedia: 0
              },
              media: {
                totalMedia: 0,
                approvedMedia: 0,
                pendingMedia: 0,
                imageCount: 0,
                videoCount: 0
              }
            };
          }
          
          return {
            ...prev,
            albums: {
              ...prev.albums,
              totalAlbums: (prev.albums.totalAlbums || 0) + 1,
              publicAlbums: prev.albums.publicAlbums + (newAlbumWithId.isPublic ? 1 : 0)
            }
          };
        });
        
        console.log('New album added to state immediately:', newAlbumWithId);
      }
      
      toast.success('Album created successfully!');
      setShowCreateAlbumModal(false);
      setNewAlbum({ name: '', description: '', isPublic: true, coverImage: undefined });
      
      // Refresh data in background to ensure consistency
      setTimeout(() => {
        fetchDashboardData(true);
      }, 1000);
      
    } catch (error: any) {
      console.error('Album creation error:', error);
      toast.error(error.response?.data?.error || 'Failed to create album');
    }
  };

  const handleEditAlbum = (album: any) => {
    // TODO: Implement edit functionality
    toast.success('Edit functionality coming soon!');
  };

  const handleUploadToAlbum = (album: Album) => {
    // TODO: Implement upload functionality
    toast.success(`Upload functionality for ${album.name} coming soon!`);
  };

  const handleViewAlbum = async (album: Album) => {
    setSelectedAlbum(album);
    setAlbumViewMode('detail');
    setLoadingMedia(true);
    
    try {
      const response = await albumsAPI.getById(album._id, {});
      setAlbumMedia(response.media || []);
    } catch (error: any) {
      toast.error('Failed to load album media');
      setAlbumMedia([]);
    } finally {
      setLoadingMedia(false);
    }
  };

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
          fetchDashboardData(true);
        }, 1000);
        
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete album');
      }
    }
  };

  const handleApproveAlbum = async (albumId: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    try {
      await albumsAPI.approve(albumId, action, rejectionReason);
      
      // Immediately update the album status in local state
      if (action === 'approve') {
        // Move from pending to albums list
        setPendingAlbums(prev => prev.filter(album => album._id !== albumId));
        
        // Find the approved album and add it to albums list
        const approvedAlbum = pendingAlbums.find(album => album._id === albumId);
        if (approvedAlbum) {
          const updatedAlbum = { ...approvedAlbum, approvalStatus: 'approved' as const };
          setAlbums(prev => [updatedAlbum, ...prev]);
          
          // Update stats
          setStats(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              albums: {
                ...prev.albums,
                totalAlbums: (prev.albums.totalAlbums || 0) + 1,
                publicAlbums: prev.albums.publicAlbums + (updatedAlbum.isPublic ? 1 : 0)
              }
            };
          });
        }
      } else if (action === 'reject') {
        // Remove from pending list
        setPendingAlbums(prev => prev.filter(album => album._id !== albumId));
      }
      
      toast.success(`Album ${action}d successfully!`);
      
      // Refresh data in background to ensure consistency
      setTimeout(() => {
        fetchDashboardData(true);
      }, 1000);
      
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${action} album`);
    }
  };

  const handleCreateInvitation = async () => {
    if (!newInvitation.guestName.trim() || !newInvitation.customMessage.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Create the invitation
      const response = await invitationsAPI.create(newInvitation);
      
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
                approvedMedia: 0,
                pendingMedia: 0,
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
        fetchDashboardData(true);
      }, 1000);
      
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create invitation');
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
      link.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/qr-${qrCode}.png`;
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
            <div className="flex items-center gap-3">
                              <Heart className="text-[#cba397] sm:w-8" size={28} />
                              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">MJ & Erica's Wedding Dashboard</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
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
                { id: 'pending-albums', label: 'Pending Albums', icon: Calendar },
                { id: 'media', label: 'Media', icon: Users },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.id
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

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Pending Approval</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.media.pendingMedia}</p>
                  </div>
                  <Calendar className="text-yellow-500" size={32} />
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    {stats.media.approvedMedia} approved media
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
                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                             invitation.isOpened 
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
                      onClick={() => fetchDashboardData(true)}
                      className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-2"
                      title="Refresh albums data"
                    >
                      🔄 Refresh
                    </button>
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
                            src={album.coverImage}
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
                                handleUploadToAlbum(album);
                              }}
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                              title="Upload Photos"
                            >
                              <Upload size={14} className="sm:w-4" />
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
                          <span>Status: {selectedAlbum.approvalStatus}</span>
                          <span>Public: {selectedAlbum.isPublic ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
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
                          className="relative group cursor-pointer"
                          onClick={() => handleMediaClick(media, index)}
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
                                src={media.thumbnailUrl || media.url}
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

        {/* Pending Albums Tab */}
        {activeTab === 'pending-albums' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Pending Album Approvals</h3>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {pendingAlbums.length} album{pendingAlbums.length !== 1 ? 's' : ''} waiting for approval
                </div>
                <button
                  onClick={() => fetchDashboardData(true)}
                  className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-2"
                  title="Refresh pending albums"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {pendingAlbums.map((album) => (
                <motion.div
                  key={album._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{album.name}</h3>
                      <p className="text-gray-600 text-sm mb-3">{album.description}</p>
                                              <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Created by: {album.creatorInfo?.email || 'Unknown'}</span>
                          <span>Type: {album.creatorInfo?.type === 'guest' ? 'Guest' : 'Host'}</span>
                          <span>Created: {new Date(album.createdAt).toLocaleDateString()}</span>
                          <span>Public: {album.isPublic ? 'Yes' : 'No'}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApproveAlbum(album._id, 'approve')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        title="Approve Album"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Please provide a reason for rejection (optional):');
                          if (reason !== null) {
                            handleApproveAlbum(album._id, 'reject', reason);
                          }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                        title="Reject Album"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {pendingAlbums.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="text-gray-400 mx-auto mb-4" size={64} />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No pending albums</h3>
                  <p className="text-gray-500">All albums have been reviewed!</p>
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

            {/* Refresh Controls */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-800">RSVP Management</h3>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshingRSVP}
                    title="Refresh RSVP data (Ctrl+R)"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshingRSVP ? 'animate-spin' : ''}`} />
                    {isRefreshingRSVP ? 'Refreshing...' : 'Refresh Now'}
                  </button>
                </div>
              </div>
              
              {lastRSVPRefresh > 0 && (
                <div className="mt-3 text-sm text-gray-500">
                  Last updated: {new Date(lastRSVPRefresh).toLocaleTimeString()}
                </div>
              )}
            </div>

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
                  <option value="Ninong">Ninong</option>
                  <option value="Ninang">Ninang</option>
                  <option value="Best Man">Best Man</option>
                  <option value="Bridesmaid">Bridesmaid</option>
                  <option value="General Guest">General Guest</option>
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
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            invitation.rsvp.status === 'attending' 
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
                            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                              currentPage === page
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
        {activeTab !== 'overview' && activeTab !== 'albums' && activeTab !== 'pending-albums' && activeTab !== 'invitations' && (
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
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Album Name *
                </label>
                                  <input
                    type="text"
                    value={newAlbum.name}
                    onChange={(e) => setNewAlbum({...newAlbum, name: e.target.value})}
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
                    onChange={(e) => setNewAlbum({...newAlbum, description: e.target.value})}
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
                    onChange={(e) => setNewAlbum({...newAlbum, isPublic: e.target.checked})}
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
                        onClick={() => setNewAlbum({...newAlbum, coverImage: undefined})}
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
                              setNewAlbum({...newAlbum, coverImage: e.target?.result as string});
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
                className="flex-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#667c93] to-[#84a2be] text-white rounded-lg hover:shadow-lg text-sm sm:text-base"
              >
                Create Album
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
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Invitation</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guest Name *
                </label>
                                  <input
                    type="text"
                    value={newInvitation.guestName}
                    onChange={(e) => setNewInvitation({...newInvitation, guestName: e.target.value})}
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
                    onChange={(e) => setNewInvitation({...newInvitation, guestRole: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent text-gray-900 font-medium"
                  >
                  <option value="General Guest">General Guest</option>
                  <option value="Ninong">Ninong</option>
                  <option value="Ninang">Ninang</option>
                  <option value="Best Man">Best Man</option>
                  <option value="Bridesmaid">Bridesmaid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Message *
                </label>
                                  <textarea
                    value={newInvitation.customMessage}
                    onChange={(e) => setNewInvitation({...newInvitation, customMessage: e.target.value})}
                    placeholder="Enter personalized message for the guest"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#84a2be] focus:border-transparent text-gray-900 font-medium"
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invitation Type
                </label>
                                  <select
                    value={newInvitation.invitationType}
                    onChange={(e) => setNewInvitation({...newInvitation, invitationType: e.target.value})}
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
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvitation}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#667c93] to-[#84a2be] text-white rounded-lg hover:shadow-lg"
              >
                Create Invitation
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && selectedInvitation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">QR Code</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="text-center space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{selectedInvitation.guestName}</h4>
                  <p className="text-sm text-gray-600 mb-4">{selectedInvitation.guestRole}</p>
                  
                  {/* QR Code Display */}
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                    <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      {selectedInvitation.qrCodePath ? (
                        <img 
                          src={selectedInvitation.qrCodePath} 
                          alt={`QR Code for ${selectedInvitation.guestName}`}
                          className="w-full h-full object-contain p-2"
                          onLoad={() => setQrImageLoading(false)}
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <QrCode className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">QR Code for</p>
                          {selectedInvitation.qrCode ? (
                            <p className="text-xs font-mono break-all">{selectedInvitation.qrCode}</p>
                          ) : (
                            <p className="text-xs text-red-500">QR Code not available</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">Scan to view invitation</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handleCopyLink(selectedInvitation.qrCode)}
                    disabled={!selectedInvitation.qrCode}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Invitation Link
                  </button>
                  
                  <button
                    onClick={() => handleOpenInvitation(selectedInvitation.qrCode)}
                    disabled={!selectedInvitation.qrCode}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Invitation
                  </button>
                  
                  {selectedInvitation.qrCodePath && (
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
              <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                {selectedMedia.mediaType === 'image' ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.originalName}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <video
                    src={selectedMedia.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-full"
                    style={{ maxHeight: '80vh' }}
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
                      className={`w-2 h-2 rounded-full cursor-pointer ${
                        index === currentMediaIndex ? 'bg-white' : 'bg-gray-500'
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
