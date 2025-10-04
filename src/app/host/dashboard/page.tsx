'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invitationsAPI, albumsAPI, mediaAPI, authAPI, rsvpAPI, createRSVPQuery } from '@/lib/api';
import { validateGuestName, validateInvitationMessage, validateAlbumName, validateAlbumDescription, validateFiles, FILE_VALIDATION_CONSTANTS, ValidationResult } from '@/lib/validation';
import ValidationFeedback, { FieldValidation } from '@/components/ValidationFeedback';
import { 
  useInvitations, 
  useAlbums, 
  useRSVPs, 
  useStats,
  useAllMedia,
  useMediaByAlbum
} from '@/hooks/useFirebaseRealtime';
import { getBestDisplayUrl, getFullSizeDisplayUrl, getVideoPlaybackUrl, getVideoDownloadUrl } from '@/lib/googleDriveUtils';
import toast, { Toaster } from 'react-hot-toast';
import { getImageUrl, CloudinaryPresets } from '@/lib/cloudinary';
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
  QrCodeIcon,
  Play
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

interface Album {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isFeatured: boolean;
  coverImage?: string;
  qrCode: string;
  qrCodeUrl?: string;
  createdAt: any;
  updatedAt: any;
  uploadUrl?: string;
  createdBy?: {
    _id: string;
    email: string;
  };
}

export default function HostDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'invitations' | 'albums' | 'media'>('overview');
  
  // Firebase real-time data
  const invitationsData = useInvitations();
  const albumsData = useAlbums();
  const rsvpsData = useRSVPs();
  const statsData = useStats();
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
  
  // Validation states
  const [invitationValidation, setInvitationValidation] = useState<{
    guestName: ValidationResult;
    customMessage: ValidationResult;
  }>({
    guestName: { isValid: true, errors: [] },
    customMessage: { isValid: true, errors: [] }
  });
  const [albumValidation, setAlbumValidation] = useState<{
    name: ValidationResult;
    description: ValidationResult;
  }>({
    name: { isValid: true, errors: [] },
    description: { isValid: true, errors: [] }
  });
  const [showInvitationValidation, setShowInvitationValidation] = useState(false);
  const [showAlbumValidation, setShowAlbumValidation] = useState(false);

  // Keep local albums state in sync with Firebase real-time data
  useEffect(() => {
    if (albumsData?.data) {
      setAlbums(albumsData.data as Album[]);
    }
  }, [albumsData?.data]);

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

  // Multi-add album state
  const [showMultiAddAlbumModal, setShowMultiAddAlbumModal] = useState(false);
  const [multiAlbums, setMultiAlbums] = useState([
    { name: '', description: '', isPublic: true, coverImage: undefined as string | undefined }
  ]);
  const [isCreatingMultiAlbums, setIsCreatingMultiAlbums] = useState(false);
  const [multiAlbumValidation, setMultiAlbumValidation] = useState<Array<{
    name: ValidationResult;
    description: ValidationResult;
  }>>([
    { name: { isValid: true, errors: [] }, description: { isValid: true, errors: [] } }
  ]);
  const [showMultiAlbumValidation, setShowMultiAlbumValidation] = useState(false);

  // Album viewing state
  const [albumMedia, setAlbumMedia] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Media viewing state
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

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
  const realtimeAllMedia = useAllMedia();
  const realtimeAlbumMedia = useMediaByAlbum((selectedAlbum && selectedAlbum.id) || '');

  const router = useRouter();

  // Close all dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdowns = document.querySelectorAll('.dropdown-menu, .album-dropdown-menu');
      dropdowns.forEach(dropdown => {
        if (!dropdown.contains(event.target as Node)) {
          dropdown.classList.add('hidden');
        }
      });
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // RSVP state
  const [rsvpData, setRsvpData] = useState<any>(null);
  const [rsvpFilters, setRsvpFilters] = useState({
    status: 'all',
    role: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Recent Invitations pagination
  const [recentInvitationsPage, setRecentInvitationsPage] = useState(1);
  const [recentInvitationsPerPage] = useState(5);
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
  const [isQRLoading, setIsQRLoading] = useState(false);

  // SWR for RSVP data with real-time configuration (critical data)
  // Firebase real-time invitation data with RSVP filtering
  useEffect(() => {
    if (invitationsData.data) {
      // Apply filters to invitation data
      let filteredData = invitationsData.data;
      
      if (rsvpFilters.status !== 'all') {
        filteredData = filteredData.filter(invitation => invitation.rsvp?.status === rsvpFilters.status);
      }
      
      if (rsvpFilters.role !== 'all') {
        filteredData = filteredData.filter(invitation => invitation.guestRole === rsvpFilters.role);
      }
      
      if (rsvpFilters.search) {
        const searchLower = rsvpFilters.search.toLowerCase();
        filteredData = filteredData.filter(invitation => 
          invitation.guestName.toLowerCase().includes(searchLower) ||
          invitation.rsvp?.guestNames?.some(name => name.toLowerCase().includes(searchLower)) ||
          invitation.rsvp?.email?.toLowerCase().includes(searchLower)
        );
      }
      
      // Calculate stats from invitation data
      const stats = {
        total: invitationsData.data.length,
        attending: invitationsData.data.filter(inv => inv.rsvp?.status === 'attending').length,
        notAttending: invitationsData.data.filter(inv => inv.rsvp?.status === 'not_attending').length,
        pending: invitationsData.data.filter(inv => inv.rsvp?.status === 'pending').length
      };
      
      setRsvpData({ invitations: filteredData, stats });
      setCurrentPage(1);
    }
  }, [invitationsData.data, rsvpFilters]);

  // Firebase real-time invitations data
  useEffect(() => {
    if (invitationsData.data) {
      // invitationsData.data is already the array, no need to set state
      // The data is available directly from the hook
    }
  }, [invitationsData.data]);

  // Firebase real-time albums data
  useEffect(() => {
    if (albumsData.data) {
      // albumsData.data is already the array, no need to set state
      // The data is available directly from the hook
    }
  }, [albumsData.data]);

  // Firebase real-time stats data
  useEffect(() => {
    if (statsData.stats) {
      // statsData.stats is already the stats object, no need to set state
      // The data is available directly from the hook
    }
  }, [statsData.stats]);

  useEffect(() => {
    // Check if user is authenticated
    const token = Cookies.get('auth_token');
    if (!token) {
      router.push('/host/login');
      return;
    }

    // No need to fetch data - Firebase real-time hooks handle this
    setLoading(false);
  }, []);

  // Firebase real-time listeners are handled by the hooks above
  // No need for Socket.IO subscriptions since we're using Firebase real-time



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
  }, [activeTab, mediaFilters, mediaPage, realtimeAllMedia.data, realtimeAllMedia.loading]);

  const fetchAllMedia = async () => {
    setLoadingAllMedia(true);
    try {
      if (realtimeAllMedia.loading) return;
      const source = (realtimeAllMedia.data as any[]) || [];

      // Normalize fields for filters and rendering
      const normalized = source.map((m: any) => ({
        ...m,
        album: m.album || m.albumId,
        url: m.url || m.fileUrl,
        mediaType: m.mediaType || (m.fileType?.startsWith('image/') ? 'image' : 'video')
      }));

      // Apply filters
      let filtered = normalized;
      if (mediaFilters.album !== 'all') filtered = filtered.filter(m => m.album === mediaFilters.album);
      if (mediaFilters.type !== 'all') filtered = filtered.filter(m => m.mediaType === mediaFilters.type);
      if (mediaFilters.approved !== 'all') filtered = filtered.filter(m => String(m.isApproved) === mediaFilters.approved);

      // Sort by createdAt desc if available
      filtered.sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return db - da;
      });

      // Pagination (20 per page)
      const pageSize = 20;
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      const start = (mediaPage - 1) * pageSize;
      const pageItems = filtered.slice(start, start + pageSize);

      setAllMedia(pageItems);
      setMediaTotalPages(totalPages);
    } catch (error: any) {
      console.error('Fetch media (realtime) error:', error);
      toast.error('Failed to load media');
    } finally {
      setLoadingAllMedia(false);
    }
  };

  // Realtime album media for Album Detail view
  useEffect(() => {
    if (!selectedAlbum || albumViewMode !== 'detail') return;
    if (realtimeAlbumMedia.loading) return;

    const source = (realtimeAlbumMedia.data as any[]) || [];
    const normalized = source.map((m: any) => ({
      ...m,
      id: m.id || m._id,
      album: m.album || m.albumId,
      url: m.url || m.fileUrl,
      mediaType: m.mediaType || (m.fileType?.startsWith('image/') ? 'image' : 'video')
    }));
    setAlbumMedia(normalized);
  }, [selectedAlbum?.id, albumViewMode, realtimeAlbumMedia.data, realtimeAlbumMedia.loading]);

  const handleMediaFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...mediaFilters, [filterType]: value };
    setMediaFilters(newFilters);
    setMediaPage(1);
  };

  const handleDeleteMediaFromGallery = async (mediaId: string) => {
    if (!confirm('Delete this media item? This cannot be undone.')) return;
    try {
      await mediaAPI.delete(mediaId);
      setAllMedia(prev => prev.filter(m => m.id !== mediaId));
      toast.success('Media deleted successfully');
    } catch (error: any) {
      toast.error('Failed to delete media');
    }
  };

  // Bulk selection handlers for media
  const toggleMediaSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedMediaIds(new Set());
  };

  const handleBulkDeleteMedia = async () => {
    if (selectedMediaIds.size === 0) return;
    
    if (!confirm(`Delete ${selectedMediaIds.size} selected media item(s)? This cannot be undone.`)) return;
    
    setIsBulkOperationLoading(true);
    try {
      const selectedMedia = allMedia.filter(media => selectedMediaIds.has(media.id || media._id));
      
      // Delete each selected media item
      for (const media of selectedMedia) {
        await mediaAPI.delete(media.id || media._id);
      }
      
      // Update local state
      setAllMedia(prev => prev.filter(media => !selectedMediaIds.has(media.id || media._id)));
      setSelectedMediaIds(new Set());
      setIsSelectionMode(false);
      
      toast.success(`Successfully deleted ${selectedMedia.length} media item(s)`);
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete some media items');
    } finally {
      setIsBulkOperationLoading(false);
    }
  };

  // fetchDashboardData function removed - using Firebase real-time hooks instead

  // RSVP data is now handled by Firebase real-time listeners

  const handleManualRefresh = async () => {
    // RSVP data is automatically refreshed by Firebase real-time listeners
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
  const totalPages = Math.ceil(((rsvpData?.invitations?.length) || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvitations = (rsvpData?.invitations || []).slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const validateAlbumForm = () => {
    const nameValidation = validateAlbumName(newAlbum.name);
    const descriptionValidation = validateAlbumDescription(newAlbum.description);
    
    setAlbumValidation({
      name: nameValidation,
      description: descriptionValidation
    });
    
    setShowAlbumValidation(true);
    
    return nameValidation.isValid && descriptionValidation.isValid;
  };

  const handleCreateAlbum = async () => {
    if (isCreatingAlbum) return;
    
    if (!validateAlbumForm()) {
      toast.error('Please fix the validation errors before creating the album');
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
      setShowAlbumValidation(false);
      setAlbumValidation({
        name: { isValid: true, errors: [] },
        description: { isValid: true, errors: [] }
      });

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
    
    const nameValidation = validateAlbumName(editAlbumData.name);
    const descriptionValidation = validateAlbumDescription(editAlbumData.description);
    
    if (!nameValidation.isValid || !descriptionValidation.isValid) {
      toast.error('Please fix the validation errors before updating the album');
      return;
    }

    setIsUpdatingAlbum(true);
    try {
      const response = await albumsAPI.update(editingAlbum.id, {
        name: editAlbumData.name.trim(),
        description: editAlbumData.description.trim(),
        isPublic: editAlbumData.isPublic,
        isFeatured: editAlbumData.isFeatured
      });

      // Update local state
      setAlbums(prev => prev.map(album =>
        album.id === editingAlbum.id
          ? { ...album, ...editAlbumData }
          : album
      ));

      toast.success('Album updated successfully!');
      setShowEditAlbumModal(false);
      setEditingAlbum(null);

      // Data will be refreshed automatically by Firebase real-time listeners
    } catch (error: any) {
      console.error('Update album error:', error);
      toast.error(error.message || 'Failed to update album');
    } finally {
      setIsUpdatingAlbum(false);
    }
  };

  // Multi-add album handlers
  const addAlbumToMultiAdd = () => {
    if (multiAlbums.length >= 10) {
      toast.error('Maximum 10 albums can be created at once');
      return;
    }
    
    setMultiAlbums(prev => [...prev, { name: '', description: '', isPublic: true, coverImage: undefined }]);
    setMultiAlbumValidation(prev => [...prev, { name: { isValid: true, errors: [] }, description: { isValid: true, errors: [] } }]);
  };

  const removeAlbumFromMultiAdd = (index: number) => {
    if (multiAlbums.length <= 1) {
      toast.error('At least one album is required');
      return;
    }
    
    setMultiAlbums(prev => prev.filter((_, i) => i !== index));
    setMultiAlbumValidation(prev => prev.filter((_, i) => i !== index));
  };

  const updateMultiAlbum = (index: number, field: string, value: any) => {
    setMultiAlbums(prev => prev.map((album, i) => 
      i === index ? { ...album, [field]: value } : album
    ));

    // Validate the field if validation is enabled
    if (showMultiAlbumValidation) {
      if (field === 'name') {
        const nameValidation = validateAlbumName(value);
        setMultiAlbumValidation(prev => prev.map((validation, i) => 
          i === index ? { ...validation, name: nameValidation } : validation
        ));
      } else if (field === 'description') {
        const descriptionValidation = validateAlbumDescription(value);
        setMultiAlbumValidation(prev => prev.map((validation, i) => 
          i === index ? { ...validation, description: descriptionValidation } : validation
        ));
      }
    }
  };

  const validateMultiAlbumForm = () => {
    const validations = multiAlbums.map(album => ({
      name: validateAlbumName(album.name),
      description: validateAlbumDescription(album.description)
    }));
    
    setMultiAlbumValidation(validations);
    setShowMultiAlbumValidation(true);
    
    return validations.every(validation => validation.name.isValid && validation.description.isValid);
  };

  const handleCreateMultiAlbums = async () => {
    if (isCreatingMultiAlbums) return;
    
    if (!validateMultiAlbumForm()) {
      toast.error('Please fix the validation errors before creating albums');
      return;
    }

    // Check for duplicate names
    const names = multiAlbums.map(album => album.name.trim().toLowerCase());
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      toast.error('Album names must be unique');
      return;
    }

    console.log('Creating multiple albums:', multiAlbums);

    try {
      setIsCreatingMultiAlbums(true);
      
      const response = await albumsAPI.createBulk(
        multiAlbums.map(album => ({
          name: album.name.trim(),
          description: album.description.trim(),
          isPublic: album.isPublic,
          coverImage: album.coverImage
        })),
        {
          qrCenterType: qrConfig.centerType,
          qrCenterOptions: qrConfig.centerOptions
        }
      );

      console.log('Multi-album creation response:', response);

      if (response.successCount === multiAlbums.length) {
        toast.success(`Successfully created ${response.successCount} albums!`);
      } else if (response.successCount > 0) {
        toast.success(`Created ${response.successCount} of ${response.totalCount} albums. ${response.failureCount} failed.`);
        if (response.failedAlbums) {
          console.error('Failed albums:', response.failedAlbums);
        }
      } else {
        toast.error('Failed to create any albums');
      }

      // Close modal and reset form
      setShowMultiAddAlbumModal(false);
      setMultiAlbums([{ name: '', description: '', isPublic: true, coverImage: undefined }]);
      setMultiAlbumValidation([{ name: { isValid: true, errors: [] }, description: { isValid: true, errors: [] } }]);
      setShowMultiAlbumValidation(false);

    } catch (error: any) {
      console.error('Multi-album creation error:', error);
      toast.error(error.response?.data?.error || 'Failed to create albums');
    } finally {
      setIsCreatingMultiAlbums(false);
    }
  };

  const handleUploadToAlbum = (album: Album) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*,video/*';
      input.onchange = async (e: any) => {
        const files: FileList | null = e.target?.files;
        if (!files || files.length === 0) return;

        // Convert FileList to File array for validation
        const filesArray = Array.from(files);
        
        // Validate files before upload
        const fileValidation = validateFiles(filesArray, {
          maxFiles: FILE_VALIDATION_CONSTANTS.MAX_HOST_PHOTOS,
          maxFileSize: FILE_VALIDATION_CONSTANTS.MAX_FILE_SIZE,
          allowedTypes: [...FILE_VALIDATION_CONSTANTS.ALLOWED_IMAGE_TYPES, ...FILE_VALIDATION_CONSTANTS.ALLOWED_VIDEO_TYPES]
        });
        
        if (!fileValidation.isValid) {
          // Show detailed error messages
          fileValidation.errors.forEach(error => {
            toast.error(error, { duration: 6000 });
          });
          return;
        }
        
        // Show warnings if any
        if (fileValidation.warnings && fileValidation.warnings.length > 0) {
          fileValidation.warnings.forEach(warning => {
            toast(warning, {
              icon: '⚠️',
              duration: 4000,
            });
          });
        }

        toast.loading(`Uploading ${filesArray.length} file(s)...`, { id: 'host-upload' });
        try {
          await mediaAPI.uploadHost(album.id, files);
          toast.success(`Successfully uploaded ${filesArray.length} file(s)!`, { id: 'host-upload' });
          // Refresh current album media if viewing detail
          if (selectedAlbum && albumViewMode === 'detail') {
            fetchAllMedia();
          }
        } catch (error: any) {
          console.error('Host upload error:', error);
          toast.error(error?.response?.data?.error || 'Failed to upload media', { id: 'host-upload' });
        }
      };
      input.click();
    } catch (err) {
      console.error('Failed to open file picker:', err);
      toast.error('Could not open file picker');
    }
  };

  const handleViewAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setAlbumViewMode('detail');
  };

  // Firebase real-time album media data is handled by the Firebase hooks above
  // No need for additional SWR calls

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
    setShowVideoPlayer(false);
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
      const next = new Set(prev);
      if (next.has(mediaId)) next.delete(mediaId); else next.add(mediaId);
      return next;
    });
  };

  const selectAllMedia = () => {
    // Use allMedia for media gallery, albumMedia for album detail view
    const mediaList = activeTab === 'media' ? allMedia : albumMedia;
    const allIds = new Set(mediaList.map(media => media.id || media._id));
    setSelectedMediaIds(allIds);
  };

  const clearSelection = () => {
    setSelectedMediaIds(new Set());
  };

  const handleBulkDownload = async () => {
    if (selectedMediaIds.size === 0) return;

    setIsBulkOperationLoading(true);
    try {
      const selectedMedia = albumMedia.filter(media => selectedMediaIds.has(media.id));

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
    if (!confirm(`Delete ${selectedMediaIds.size} selected item(s)? This cannot be undone.`)) return;
    setIsBulkOperationLoading(true);
    try {
      const selected = albumMedia.filter(media => selectedMediaIds.has(media.id));
      for (const media of selected) {
        await mediaAPI.delete(media.id);
      }
      setAlbumMedia(prev => prev.filter(media => !selectedMediaIds.has(media.id)));
      setSelectedMediaIds(new Set());
      toast.success('Selected media deleted');
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete selected media');
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
        setAlbums(prev => prev.filter(album => album.id !== albumId));

        // Stats are now handled by Firebase real-time hooks
        // No need to update state manually

        toast.success('Album deleted successfully!');

        // Data is handled by Firebase real-time hooks

      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete album');
      }
    }
  };


  const validateInvitationForm = () => {
    const nameValidation = validateGuestName(newInvitation.guestName);
    const messageValidation = validateInvitationMessage(newInvitation.customMessage);
    
    setInvitationValidation({
      guestName: nameValidation,
      customMessage: messageValidation
    });
    
    setShowInvitationValidation(true);
    
    return nameValidation.isValid && messageValidation.isValid;
  };

  const handleCreateInvitation = async () => {
    if (!validateInvitationForm()) {
      toast.error('Please fix the validation errors before creating the invitation');
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

      // Firebase real-time listeners will automatically update the UI

      // Immediately add the new invitation to the local state
      if (response.invitation) {
        const newInvitationWithId = {
          ...response.invitation,
          _id: response.invitation._id || Date.now().toString(), // Fallback ID if not provided
          createdAt: new Date().toISOString(),
          qrCode: response.invitation.qrCode || `qr-${Date.now()}`,
          status: 'active'
        };

        // Data is now handled by Firebase real-time hooks
        // No need to update state manually

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
      setShowInvitationValidation(false);
      setInvitationValidation({
        guestName: { isValid: true, errors: [] },
        customMessage: { isValid: true, errors: [] }
      });

      // Data is handled by Firebase real-time hooks

    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create invitation');
    } finally {
      setIsCreatingInvitation(false);
    }
  };

  const handleDeleteInvitation = async (invitationId: string, guestName: string) => {
    if (!confirm(`Are you sure you want to delete the invitation for ${guestName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await invitationsAPI.delete(invitationId);
      toast.success(`Invitation for ${guestName} deleted successfully!`);
      
      // Firebase real-time listeners will automatically update the UI
      // No need to manually update local state
    } catch (error: any) {
      console.error('Delete invitation error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete invitation');
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
      link.href = `https://api-rpahsncjpa-as.a.run.app/uploads/qr-${qrCode}.png`;
      link.download = `${guestName.replace(/\s+/g, '_')}_invitation_qr.png`;
      link.click();
    } catch (error) {
      toast.error('Failed to download QR code');
    }
  };

  const handleSaveQRSettings = async () => {
    // Placeholder save; integrate backend if available
    await new Promise((r) => setTimeout(r, 500));
    toast.success('QR settings saved');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster position="top-center" />

      {/* Modern Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white shadow-md p-2 overflow-hidden">
                <img
                  src={getImageUrl('imgs', 'monogram-flower-black.png', CloudinaryPresets.highQuality)}
                  alt="MJ & Erica Monogram"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-slate-800">Wedding Dashboard</h1>
                <p className="text-sm text-slate-600">Manage your special day</p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Quick Stats - Desktop Only */}
              <div className="hidden lg:flex items-center gap-6 mr-4">
                {statsData.stats && (
                  <>
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-800">{statsData.stats?.invitations?.total || 0}</div>
                      <div className="text-xs text-slate-600">Invites</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-800">{statsData.stats?.albums?.totalAlbums || 0}</div>
                      <div className="text-xs text-slate-600">Albums</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-800">{statsData.stats?.media?.totalMedia || 0}</div>
                      <div className="text-xs text-slate-600">Media</div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => setShowQRConfig(true)}
                className="bg-white text-slate-700 px-3 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 transition-all duration-200 shadow-sm border border-slate-200 text-sm"
              >
                <QrCodeIcon size={16} />
                <span className="hidden sm:inline">QR Settings</span>
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 rounded-lg font-medium flex items-center gap-2 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md text-sm"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">New Invite</span>
              </button>

              <button
                onClick={handleLogout}
                className="text-slate-600 hover:text-slate-800 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/50 transition-all duration-200 text-sm"
              >
                <Settings size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Modern Navigation Tabs - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile Dropdown Navigation */}
          <div className="block sm:hidden">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
                className="w-full px-4 py-3 bg-transparent border-none text-slate-800 font-medium focus:outline-none focus:ring-0 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 12px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '16px',
                  paddingRight: '40px'
                }}
              >
                <option value="overview">📊 Overview</option>
                <option value="invitations">✉️ Invitations</option>
                <option value="albums">🖼️ Albums</option>
                <option value="media">👥 Media</option>
              </select>
            </div>
          </div>

          {/* Desktop Horizontal Tabs */}
          <div className="hidden sm:block">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1">
              <nav className="flex space-x-1">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'invitations', label: 'Invitations', icon: Mail },
                  { id: 'albums', label: 'Albums', icon: Image },
                  { id: 'media', label: 'Media', icon: Users },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3 px-4 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 flex-1 justify-center ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                  >
                    <tab.icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>


        {/* Content based on active tab */}
        {activeTab === 'overview' && statsData.stats && (
          <div className="space-y-6 sm:space-y-8">
            {/* Modern Stats Cards - 2x2 on Mobile, Single Row on Desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                    <Mail size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-slate-800">{statsData.stats?.invitations?.total || 0}</p>
                    <p className="text-sm text-slate-600">Total Invitations</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-green-600">{statsData.stats?.invitations?.opened || 0}</span> opened
                  </div>
                  <div className="text-xs text-slate-500">
                    {Math.round(((statsData.stats?.invitations?.opened || 0) / (statsData.stats?.invitations?.total || 1)) * 100)}% rate
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                    <Image size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-slate-800">{statsData.stats?.albums?.totalAlbums || 0}</p>
                    <p className="text-sm text-slate-600">Albums</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-blue-600">{statsData.stats?.albums?.publicAlbums || 0}</span> public
                  </div>
                  <div className="text-xs text-slate-500">
                    {statsData.stats?.albums?.featuredAlbums || 0} featured
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                    <Users size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-slate-800">{statsData.stats?.media?.totalMedia || 0}</p>
                    <p className="text-sm text-slate-600">Total Media</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-emerald-600">{statsData.stats?.media?.imageCount || 0}</span> photos
                  </div>
                  <div className="text-xs text-slate-500">
                    {statsData.stats?.media?.videoCount || 0} videos
                  </div>
                </div>
              </motion.div>

              {/* RSVP Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                    <Heart size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-slate-800">{rsvpData?.stats?.attending || 0}</p>
                    <p className="text-sm text-slate-600">Attending</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-red-600">{rsvpData?.stats?.notAttending || 0}</span> declined
                  </div>
                  <div className="text-xs text-slate-500">
                    {rsvpData?.stats?.pending || 0} pending
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Invitations - Modern Card Layout */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-800">Recent Invitations</h3>
                <button
                  onClick={() => setActiveTab('invitations')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 hover:underline"
                >
                  View All <ExternalLink size={14} />
                </button>
              </div>
              
              {/* Mobile-First Card Layout */}
              <div className="space-y-4">
                {invitationsData.data?.slice(
                  (recentInvitationsPage - 1) * recentInvitationsPerPage,
                  recentInvitationsPage * recentInvitationsPerPage
                ).map((invitation: any) => (
                  <motion.div
                    key={invitation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-all duration-200 border border-slate-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {invitation.guestName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{invitation.guestName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-white text-slate-700 px-2 py-1 rounded-lg text-xs font-medium border border-slate-200">
                              {invitation.guestRole}
                            </span>
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              invitation.openedAt
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                              {invitation.openedAt ? '✓ Opened' : '⏳ Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-500 hidden sm:block">
                          {(() => {
                            try {
                              const date = invitation.createdAt?.toDate ? invitation.createdAt.toDate() : new Date(invitation.createdAt);
                              return date.toLocaleDateString();
                            } catch (error) {
                              return 'Invalid Date';
                            }
                          })()}
                        </div>
                        
                        {invitation.qrCode && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleViewQR(invitation)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="View QR Code"
                            >
                              <QrCode size={16} />
                            </button>
                            <button
                              onClick={() => handleCopyLink(invitation.qrCode)}
                              className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                              title="Copy Link"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenInvitation(invitation.qrCode)}
                              className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                              title="Open Invitation"
                            >
                              <ExternalLink size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Modern Pagination */}
                {invitationsData.data && invitationsData.data.length > recentInvitationsPerPage && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                    <div className="text-sm text-slate-600">
                      Showing {((recentInvitationsPage - 1) * recentInvitationsPerPage) + 1} to {Math.min(recentInvitationsPage * recentInvitationsPerPage, invitationsData.data.length)} of {invitationsData.data.length} invitations
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRecentInvitationsPage(prev => Math.max(1, prev - 1))}
                        disabled={recentInvitationsPage === 1}
                        className="px-4 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg">
                        {recentInvitationsPage} of {Math.ceil(invitationsData.data.length / recentInvitationsPerPage)}
                      </span>
                      <button
                        onClick={() => setRecentInvitationsPage(prev => Math.min(Math.ceil(invitationsData.data.length / recentInvitationsPerPage), prev + 1))}
                        disabled={recentInvitationsPage >= Math.ceil(invitationsData.data.length / recentInvitationsPerPage)}
                        className="px-4 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modern Albums Management Tab */}
        {activeTab === 'albums' && (
          <div className="space-y-6">
            {albumViewMode === 'grid' ? (
              // Modern Albums Grid View
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Wedding Albums</h3>
                    <p className="text-slate-600 mt-1">Organize and manage your wedding photo collections</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowCreateAlbumModal(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <Plus size={20} />
                      <span>Create Album</span>
                    </button>
                    <button
                      onClick={() => setShowMultiAddAlbumModal(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <Plus size={20} />
                      <span>Create Multiple</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {albums.map((album, index) => (
                    <motion.div
                      key={album.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                      onClick={() => handleViewAlbum(album)}
                    >
                      {/* Album Cover */}
                      <div className="h-48 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex items-center justify-center relative overflow-hidden">
                        {album.coverImage ? (
                          <img
                            src={getBestDisplayUrl(album.coverImage, undefined, 400)}
                            alt={album.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              console.error('Failed to load album cover:', album.coverImage);
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="text-center">
                            <Image className="text-slate-400 mx-auto mb-2" size={48} />
                            <p className="text-slate-500 text-sm">No cover image</p>
                          </div>
                        )}
                        
                        {/* Action buttons positioned at bottom right of cover image */}
                        <div className="absolute bottom-3 right-3 z-30" style={{ pointerEvents: 'auto' }}>
                          {/* Mobile: Always visible menu button */}
                          <div className="sm:hidden">
                            <button
                              onPointerDown={(e) => {
                                console.log('Settings button pointer down on mobile');
                                e.preventDefault();
                                e.stopPropagation();
                                
                                const button = e.currentTarget;
                                const menu = button.nextElementSibling as HTMLElement;
                                const isHidden = menu.classList.contains('hidden');
                                
                                // Close all other menus first
                                document.querySelectorAll('.album-dropdown-menu').forEach(dropdown => {
                                  if (dropdown !== menu) {
                                    dropdown.classList.add('hidden');
                                  }
                                });
                                
                                // Toggle current menu
                                if (isHidden) {
                                  // Position the menu dynamically
                                  const buttonRect = button.getBoundingClientRect();
                                  const viewportHeight = window.innerHeight;
                                  
                                  // Check if there's enough space above the button
                                  const spaceAbove = buttonRect.top;
                                  const spaceBelow = viewportHeight - buttonRect.bottom;
                                  
                                  if (spaceAbove > 200) {
                                    // Position above the button
                                    menu.style.position = 'fixed';
                                    menu.style.top = `${buttonRect.top - 200}px`;
                                    menu.style.right = `${window.innerWidth - buttonRect.right}px`;
                                    menu.style.bottom = 'auto';
                                  } else {
                                    // Position below the button
                                    menu.style.position = 'fixed';
                                    menu.style.top = `${buttonRect.bottom + 8}px`;
                                    menu.style.right = `${window.innerWidth - buttonRect.right}px`;
                                    menu.style.bottom = 'auto';
                                  }
                                  
                                  menu.classList.remove('hidden');
                                  console.log('Menu opened');
                                } else {
                                  menu.classList.add('hidden');
                                  console.log('Menu closed');
                                }
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              className="bg-white/95 backdrop-blur-sm text-slate-700 rounded-full p-3 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 border border-white/50 touch-manipulation"
                              title="Album Actions"
                              style={{ 
                                minWidth: '44px', 
                                minHeight: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Settings size={18} />
                            </button>
                            <div className="album-dropdown-menu hidden bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 min-w-[160px] backdrop-blur-sm">
                               <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleViewAlbumQR(album);
                                  (e.currentTarget.closest('.album-dropdown-menu') as HTMLElement)?.classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-3 transition-colors"
                              >
                                <QrCode size={16} />
                                View QR Code
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleUploadToAlbum(album);
                                  (e.currentTarget.closest('.album-dropdown-menu') as HTMLElement)?.classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-3 transition-colors"
                              >
                                <Upload size={16} />
                                Upload Photos
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditAlbum(album);
                                  (e.currentTarget.closest('.album-dropdown-menu') as HTMLElement)?.classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-3 transition-colors"
                              >
                                <Edit size={16} />
                                Edit Album
                              </button>
                              <div className="border-t border-slate-200 my-1"></div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteAlbum(album.id);
                                  (e.currentTarget.closest('.album-dropdown-menu') as HTMLElement)?.classList.add('hidden');
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                              >
                                <Trash2 size={16} />
                                Delete Album
                              </button>
                            </div>
                          </div>

                          {/* Desktop: Hover action buttons */}
                          <div className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-all duration-300 gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewAlbumQR(album);
                              }}
                              className="bg-white/95 text-purple-600 p-2 rounded-lg hover:bg-white transition-colors shadow-lg hover:shadow-xl border border-white/50"
                              title="View QR Code"
                            >
                              <QrCode size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAlbum(album);
                              }}
                              className="bg-white/95 text-blue-600 p-2 rounded-lg hover:bg-white transition-colors shadow-lg hover:shadow-xl border border-white/50"
                              title="Edit Album"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAlbum(album.id);
                              }}
                              className="bg-white/95 text-red-600 p-2 rounded-lg hover:bg-white transition-colors shadow-lg hover:shadow-xl border border-white/50"
                              title="Delete Album"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Status badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          {album.isPublic && (
                            <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                              Public
                            </span>
                          )}
                          {album.isFeatured && (
                            <span className="bg-amber-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Album Info */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{album.name}</h3>
                        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{album.description || 'No description provided'}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Image size={16} />
                            <span>Album</span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {(() => {
                              try {
                                const date = album.createdAt?.toDate ? album.createdAt.toDate() : new Date(album.createdAt);
                                return date.toLocaleDateString();
                              } catch (error) {
                                return 'Recent';
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {albums.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 max-w-md mx-auto">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Image className="text-slate-400" size={40} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">No albums yet</h3>
                      <p className="text-slate-600 mb-8 leading-relaxed">Create your first album to start organizing and sharing your beautiful wedding memories with guests!</p>
                      <button
                        onClick={() => setShowCreateAlbumModal(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Create Your First Album
                      </button>
                    </div>
                  </motion.div>
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
                  {/* Modern Album Header */}
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handleBackToAlbums}
                          className="bg-slate-100 text-slate-700 hover:bg-slate-200 gap-2 px-4 py-2 rounded-xl transition-colors font-medium"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <div>
                          <h3 className="text-3xl font-bold text-slate-800">{selectedAlbum.name}</h3>
                          <p className="text-slate-600 mt-1">{selectedAlbum.description || 'No description'}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-slate-600">{albumMedia.length} items</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className={`w-2 h-2 rounded-full ${selectedAlbum.isPublic ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                              <span className="text-slate-600">{selectedAlbum.isPublic ? 'Public' : 'Private'}</span>
                            </div>
                            {selectedAlbum.isFeatured && (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                <span className="text-slate-600">Featured</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {/* Selection Controls */}
                        {albumMedia.length > 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={toggleSelectionMode}
                              className={`px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium ${isSelectionMode
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                              {isSelectionMode ? <CheckSquare size={16} /> : <Square size={16} />}
                              <span className="hidden sm:inline">{isSelectionMode ? 'Exit Selection' : 'Select Photos'}</span>
                            </button>

                            {isSelectionMode && (
                              <>
                                <button
                                  onClick={selectAllMedia}
                                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium"
                                >
                                  All
                                </button>
                                <button
                                  onClick={clearSelection}
                                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium"
                                >
                                  Clear
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => handleUploadToAlbum(selectedAlbum)}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-md"
                        >
                          <Upload size={16} />
                          <span className="hidden sm:inline">Upload</span>
                        </button>
                        <button
                          onClick={() => handleEditAlbum(selectedAlbum)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-md"
                        >
                          <Edit size={16} />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Modern Bulk Action Controls */}
                  {isSelectionMode && selectedMediaIds.size > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-6"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {selectedMediaIds.size}
                          </div>
                          <span className="font-medium text-slate-700">
                            {selectedMediaIds.size} item{selectedMediaIds.size !== 1 ? 's' : ''} selected
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleBulkDownload}
                            disabled={isBulkOperationLoading}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 font-medium shadow-md"
                          >
                            <Download size={16} />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={handleBulkDelete}
                            disabled={isBulkOperationLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 font-medium shadow-md"
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Modern Album Content */}
                  {loadingMedia ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading media...</p>
                      </div>
                    </div>
                  ) : albumMedia.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {albumMedia.map((media, index) => (
                        <motion.div
                          key={media.id || index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={`relative group ${isSelectionMode ? 'cursor-default' : 'cursor-pointer'} bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300`}
                          onClick={() => isSelectionMode ? toggleMediaSelection(media.id) : handleMediaClick(media, index)}
                        >
                          {media.mediaType === 'image' ? (
                            <div className="aspect-square w-full bg-slate-100 relative overflow-hidden">
                              <img
                                src={getBestDisplayUrl(media.thumbnailUrl || media.url, media.googleDriveFileId, 300, media.mediaType)}
                                alt={media.originalName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  console.error('Failed to load image:', media.url);
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.className = 'w-full h-full object-cover bg-red-100 border-2 border-red-300';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="aspect-square w-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center relative overflow-hidden">
                              {/* Video Thumbnail - Use poster image if available, otherwise show play icon */}
                              {media.thumbnailUrl ? (
                                <img
                                  src={getBestDisplayUrl(media.thumbnailUrl, media.googleDriveThumbnailId, 300, 'image')}
                                  alt={media.originalName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Hide image and show play icon fallback
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : null}
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                <div className="bg-white bg-opacity-90 rounded-full p-3 shadow-lg">
                                  <Play className="text-blue-600" size={24} />
                                </div>
                              </div>
                              {/* Video type indicator */}
                              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                VIDEO
                              </div>
                            </div>
                          )}

                          {/* Selection Checkbox */}
                          {isSelectionMode && (
                            <div className="absolute top-3 left-3 z-10">
                              <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${selectedMediaIds.has(media.id)
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110'
                                : 'bg-white/90 border-slate-300 backdrop-blur-sm'
                                }`}>
                                {selectedMediaIds.has(media.id) && <Check size={18} />}
                              </div>
                            </div>
                          )}

                          {/* Media Info Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end">
                            <div className="p-3 w-full">
                              <div className="text-white">
                                <p className="font-medium text-sm truncate">{media.originalName || 'Untitled'}</p>
                                {media.uploadedBy && (
                                  <p className="text-xs opacity-90 mt-1">By {media.uploadedBy}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Mobile-friendly action buttons */}
                          {!isSelectionMode && (
                            <div className="absolute top-3 right-3 z-10">
                              {/* Mobile: Always visible action button */}
                              <div className="sm:hidden relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const menu = e.currentTarget.nextElementSibling as HTMLElement;
                                    menu.classList.toggle('hidden');
                                    // Close other open menus
                                    document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
                                      if (dropdown !== menu) {
                                        dropdown.classList.add('hidden');
                                      }
                                    });
                                  }}
                                  className="bg-white/90 backdrop-blur-sm text-slate-700 rounded-lg p-2 shadow-lg hover:bg-white transition-colors"
                                  title="Media Actions"
                                >
                                  <Settings size={16} />
                                </button>
                                <div className="dropdown-menu hidden absolute top-10 right-0 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-30 min-w-[140px]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMediaClick(media, index);
                                      e.currentTarget.closest('.dropdown-menu')?.classList.add('hidden');
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                  >
                                    <Eye size={16} />
                                    View Media
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
                                      e.currentTarget.closest('.dropdown-menu')?.classList.add('hidden');
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                  >
                                    <Download size={16} />
                                    Download
                                  </button>
                                </div>
                              </div>
                              
                              {/* Desktop: Hover indicator */}
                              <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-lg">
                                  <Eye className="text-slate-700" size={16} />
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-16"
                    >
                      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 max-w-md mx-auto">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Image className="text-slate-400" size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-3">No media yet</h3>
                        <p className="text-slate-600 mb-8 leading-relaxed">This album is empty. Upload some beautiful photos and videos to get started!</p>
                        <button
                          onClick={() => handleUploadToAlbum(selectedAlbum)}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
                        >
                          <Upload size={20} />
                          <span>Upload First Media</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Modern Footer Info */}
                  <div className="mt-8 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-slate-700 font-medium">{albumMedia.length} total files</span>
                        </div>
                        {selectedAlbum.createdBy && (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            <span className="text-slate-600">Created by {selectedAlbum.createdBy.email}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        Last updated: {(() => {
                          try {
                            const date = selectedAlbum.updatedAt?.toDate ? selectedAlbum.updatedAt.toDate() : new Date(selectedAlbum.updatedAt || selectedAlbum.createdAt);
                            return date.toLocaleDateString();
                          } catch (error) {
                            return 'Recently';
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            )}
          </div>
        )}

        {/* Modern Media Management Tab */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Media Gallery</h3>
                <p className="text-slate-600 mt-1">Browse and manage all wedding photos and videos</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-slate-200">
                  <span className="text-sm font-medium text-slate-700">{allMedia.length}</span>
                  <span className="text-xs text-slate-500 ml-1">items</span>
                </div>
                {allMedia.length > 0 && (
                  <button
                    onClick={toggleMediaSelectionMode}
                    className={`px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium ${
                      isSelectionMode
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {isSelectionMode ? <CheckSquare size={16} /> : <Square size={16} />}
                    <span className="hidden sm:inline">{isSelectionMode ? 'Exit Selection' : 'Select Items'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modern Filters */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-800">Filter Media</h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Album</label>
                  <select
                    value={mediaFilters.album}
                    onChange={(e) => handleMediaFilterChange('album', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Albums</option>
                    {albums.map((album) => (
                      <option key={album.id} value={album.id}>{album.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <select
                    value={mediaFilters.type}
                    onChange={(e) => handleMediaFilterChange('type', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Types</option>
                    <option value="image">📷 Images</option>
                    <option value="video">🎥 Videos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={mediaFilters.approved}
                    onChange={(e) => handleMediaFilterChange('approved', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="true">✅ Approved</option>
                    <option value="false">⏳ Pending</option>
                  </select>
                </div>
              </div>

              {/* Bulk Action Controls */}
              {isSelectionMode && selectedMediaIds.size > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 mb-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-white">
                        <span className="font-semibold">{selectedMediaIds.size}</span>
                        <span className="ml-1">item{selectedMediaIds.size !== 1 ? 's' : ''} selected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={selectAllMedia}
                          className="px-3 py-1 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
                        >
                          Select All
                        </button>
                        <button
                          onClick={clearSelection}
                          className="px-3 py-1 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBulkDeleteMedia}
                        disabled={isBulkOperationLoading}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isBulkOperationLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        <span>Delete Selected</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Modern Media Gallery */}
              {loadingAllMedia ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading media gallery...</p>
                  </div>
                </div>
              ) : allMedia.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {allMedia.map((media, index) => (
                    <motion.div
                      key={media._id || media.id || `media-${index}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative group cursor-pointer bg-white rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 ${
                        selectedMediaIds.has(media.id || media._id) 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <div className="absolute top-3 left-3 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMediaSelection(media.id || media._id);
                            }}
                            className="w-6 h-6 rounded-lg bg-white/90 backdrop-blur-sm border-2 border-slate-300 flex items-center justify-center hover:bg-white transition-colors"
                          >
                            {selectedMediaIds.has(media.id || media._id) && (
                              <Check size={14} className="text-blue-600" />
                            )}
                          </button>
                        </div>
                      )}
                      {media.mediaType === 'image' ? (
                        <div className="aspect-square w-full bg-slate-100 relative overflow-hidden">
                          <img
                            src={getBestDisplayUrl(media.thumbnailUrl || media.url, media.googleDriveFileId, 300, media.mediaType)}
                            alt={media.originalName || 'Media'}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              console.error('Failed to load image:', media.url);
                              const target = e.currentTarget as HTMLImageElement;
                              target.className = 'w-full h-full object-cover bg-red-100 border-2 border-red-300';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="aspect-square w-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center relative overflow-hidden">
                          {/* Video Thumbnail - Use poster image if available */}
                          {media.thumbnailUrl ? (
                            <img
                              src={getBestDisplayUrl(media.thumbnailUrl, media.googleDriveThumbnailId, 300, 'image')}
                              alt={media.originalName || 'Video'}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                // Hide image and show play icon fallback
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          {/* Video type indicator */}
                          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            VIDEO
                          </div>
                        </div>
                      )}

                      {/* Media Info Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end">
                        <div className="p-3 w-full">
                          <div className="text-white">
                            <p className="font-medium text-sm truncate">{media.originalName || 'Untitled'}</p>
                            {media.uploadedBy && (
                              <p className="text-xs opacity-90 mt-1">By {media.uploadedBy}</p>
                            )}
                            {media.album?.name && (
                              <p className="text-xs opacity-75 mt-1">Album: {media.album.name}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mobile-friendly Action Buttons */}
                      <div className="absolute top-3 right-3 z-10">
                        {/* Mobile: Always visible menu button */}
                        <div className="sm:hidden relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const menu = e.currentTarget.nextElementSibling as HTMLElement;
                              menu.classList.toggle('hidden');
                              // Close other open menus
                              document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
                                if (dropdown !== menu) {
                                  dropdown.classList.add('hidden');
                                }
                              });
                            }}
                            className="bg-white/90 backdrop-blur-sm text-slate-700 rounded-lg p-2 shadow-lg hover:bg-white transition-colors"
                            title="Media Actions"
                          >
                            <Settings size={16} />
                          </button>
                          <div className="dropdown-menu hidden absolute top-10 right-0 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-30 min-w-[140px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(media.url, '_blank');
                                e.currentTarget.closest('.dropdown-menu')?.classList.add('hidden');
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                            >
                              <Eye size={16} />
                              View Full Size
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
                                e.currentTarget.closest('.dropdown-menu')?.classList.add('hidden');
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                            >
                              <Download size={16} />
                              Download
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMediaFromGallery(media.id);
                                e.currentTarget.closest('.dropdown-menu')?.classList.add('hidden');
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        {/* Desktop: Hover action buttons */}
                        <div className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-all duration-300 gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(media.url, '_blank');
                            }}
                            className="bg-white/90 backdrop-blur-sm text-slate-700 rounded-xl p-2 shadow-lg hover:bg-white transition-colors"
                            title="View Full Size"
                          >
                            <Eye size={16} />
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
                            className="bg-white/90 backdrop-blur-sm text-slate-700 rounded-xl p-2 shadow-lg hover:bg-white transition-colors"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMediaFromGallery(media.id);
                            }}
                            className="bg-red-500/90 backdrop-blur-sm text-white rounded-xl p-2 shadow-lg hover:bg-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <div className="bg-slate-50 rounded-2xl p-12 max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Image className="text-slate-400" size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-3">No media found</h3>
                    <p className="text-slate-600 leading-relaxed">No photos or videos match your current filters. Try adjusting your search criteria.</p>
                  </div>
                </motion.div>
              )}

              {/* Modern Pagination */}
              {mediaTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    onClick={() => setMediaPage(Math.max(1, mediaPage - 1))}
                    disabled={mediaPage === 1}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>
                  <div className="px-4 py-2 bg-slate-100 rounded-xl">
                    <span className="text-sm font-medium text-slate-700">
                      {mediaPage} of {mediaTotalPages}
                    </span>
                  </div>
                  <button
                    onClick={() => setMediaPage(Math.min(mediaTotalPages, mediaPage + 1))}
                    disabled={mediaPage === mediaTotalPages}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modern Invitations Management Tab */}
        {activeTab === 'invitations' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Guest Invitations</h3>
                <p className="text-slate-600 mt-1">Manage invitations and track RSVP responses</p>
              </div>
            </div>

            {/* Modern RSVP Stats Cards - 2x2 on Mobile, Single Row on Desktop */}
            {rsvpData?.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <motion.div
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                      <Mail size={24} />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-slate-800">{rsvpData.stats.total}</div>
                      <div className="text-sm text-slate-600">Total Invitations</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle size={24} />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-slate-800">{rsvpData.stats.attending}</div>
                      <div className="text-sm text-slate-600">Attending</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                      <XCircle size={24} />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-slate-800">{rsvpData.stats.notAttending}</div>
                      <div className="text-sm text-slate-600">Not Attending</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                      <Clock size={24} />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-slate-800">{rsvpData.stats.pending}</div>
                      <div className="text-sm text-slate-600">Pending</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Modern RSVP Filters */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-800">Filter Invitations</h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">RSVP Status</label>
                  <select
                    value={rsvpFilters.status}
                    onChange={(e) => {
                      const newFilters = { ...rsvpFilters, status: e.target.value };
                      setRsvpFilters(newFilters);
                    }}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="attending">✅ Attending</option>
                    <option value="not_attending">❌ Not Attending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Guest Role</label>
                  <select
                    value={rsvpFilters.role}
                    onChange={(e) => {
                      const newFilters = { ...rsvpFilters, role: e.target.value };
                      setRsvpFilters(newFilters);
                    }}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Roles</option>
                    {entourageRoles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search guests..."
                    value={rsvpFilters.search}
                    onChange={(e) => {
                      const newFilters = { ...rsvpFilters, search: e.target.value };
                      setRsvpFilters(newFilters);
                    }}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>

              {/* Modern Mobile-Friendly RSVP List */}
              <div className="space-y-4">
                {currentInvitations.map((invitation: any, index: number) => (
                  <motion.div
                    key={invitation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-50 rounded-2xl p-4 hover:bg-slate-100 transition-all duration-200 border border-slate-200"
                  >
                    {/* Mobile-First Layout */}
                    <div className="space-y-3">
                      {/* Header Row - Guest Info & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Avatar with Status Icon */}
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {invitation.guestName.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1">
                              {invitation.rsvp.status === 'attending' && (
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                              )}
                              {invitation.rsvp.status === 'not_attending' && (
                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                  <XCircle className="w-3 h-3 text-white" />
                                </div>
                              )}
                              {invitation.rsvp.status === 'pending' && (
                                <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                                  <Clock className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Guest Details */}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-slate-800 truncate">{invitation.guestName}</h4>
                            <p className="text-sm text-slate-600">{invitation.guestRole}</p>
                            {invitation.rsvp.status === 'attending' && invitation.rsvp.attendeeCount && (
                              <p className="text-xs text-emerald-600 font-medium mt-1">
                                {invitation.rsvp.attendeeCount} guest{invitation.rsvp.attendeeCount !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                          <div className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium border ${
                            invitation.rsvp.status === 'attending'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : invitation.rsvp.status === 'not_attending'
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>
                            {invitation.rsvp.status === 'attending' ? '✅ Attending' :
                              invitation.rsvp.status === 'not_attending' ? '❌ Declined' : '⏳ Pending'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Response Date & Actions Row */}
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
                        <div className="text-xs text-slate-500">
                          {invitation.rsvp.respondedAt ? (
                            <span>Responded: {new Date(invitation.rsvp.respondedAt).toLocaleDateString()}</span>
                          ) : (
                            <span>No response yet</span>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          {invitation.qrCode && (
                            <>
                              <button
                                onClick={() => handleViewQR(invitation)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="View QR Code"
                              >
                                <QrCode size={16} />
                              </button>
                              <button
                                onClick={() => handleCopyLink(invitation.qrCode)}
                                className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                                title="Copy Link"
                              >
                                <Copy size={16} />
                              </button>
                              <button
                                onClick={() => handleOpenInvitation(invitation.qrCode)}
                                className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                                title="Open Invitation"
                              >
                                <ExternalLink size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteInvitation(invitation.id, invitation.guestName)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete Invitation"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>



                    {/* Additional Guest Information - Mobile Optimized */}
                    {(invitation.rsvp.guestNames?.length > 0 || invitation.rsvp.email || invitation.rsvp.phone) && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                        {invitation.rsvp.guestNames && invitation.rsvp.guestNames.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="p-1 bg-blue-100 rounded">
                              <User className="w-3 h-3 text-blue-600" />
                            </div>
                            <span className="font-medium text-slate-700">Guest:</span>
                            <span className="text-slate-600 truncate">{invitation.rsvp.guestNames[0]}</span>
                          </div>
                        )}
                        
                        {invitation.rsvp.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="p-1 bg-emerald-100 rounded">
                              <Mail className="w-3 h-3 text-emerald-600" />
                            </div>
                            <span className="font-medium text-slate-700">Email:</span>
                            <span className="text-slate-600 truncate">{invitation.rsvp.email}</span>
                          </div>
                        )}
                        
                        {invitation.rsvp.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="p-1 bg-purple-100 rounded">
                              <Phone className="w-3 h-3 text-purple-600" />
                            </div>
                            <span className="font-medium text-slate-700">Phone:</span>
                            <span className="text-slate-600">{invitation.rsvp.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Modern Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
                    <div className="text-sm text-slate-600 text-center sm:text-left">
                      Showing {startIndex + 1} to {Math.min(endIndex, rsvpData?.invitations?.length || 0)} of {rsvpData?.invitations?.length || 0} invitations
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                      >
                        <ChevronLeft size={16} />
                        <span className="hidden sm:inline">Previous</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let page;
                          if (totalPages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                          } else {
                            page = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-2 text-sm rounded-xl transition-colors font-medium ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {rsvpData?.invitations?.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <div className="bg-slate-50 rounded-2xl p-12 max-w-md mx-auto">
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="text-slate-400" size={40} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">No invitations found</h3>
                      <p className="text-slate-600 leading-relaxed">No RSVP responses match your current filters. Try adjusting your search criteria.</p>
                    </div>
                  </motion.div>
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

      {/* Modern Create Album Modal */}
      <AnimatePresence>
        {showCreateAlbumModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto"
            onClick={() => setShowCreateAlbumModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-lg my-4 shadow-2xl border border-slate-200 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Image className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Create New Album</h3>
                      <p className="text-sm text-slate-600">Add a new photo album for your wedding</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateAlbumModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* QR Configuration Indicator */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Palette className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-blue-800">
                        QR Code Style: <span className="capitalize text-blue-700">
                          {qrConfig.centerType === 'none' ? 'Plain QR Code' :
                            qrConfig.centerType === 'logo' ? 'With Logo' :
                              `With Monogram (${qrConfig.centerOptions.monogram})`}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        This album will use your current QR configuration. Change it in QR Settings if needed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Album Name *
                    </label>
                    <input
                      type="text"
                      value={newAlbum.name}
                      onChange={(e) => {
                        setNewAlbum({ ...newAlbum, name: e.target.value });
                        if (showAlbumValidation) {
                          const nameValidation = validateAlbumName(e.target.value);
                          setAlbumValidation(prev => ({ ...prev, name: nameValidation }));
                        }
                      }}
                      placeholder="Enter album name"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 font-medium bg-white transition-colors ${
                        showAlbumValidation && !albumValidation.name.isValid
                          ? 'border-red-300 bg-red-50'
                          : 'border-slate-300'
                      }`}
                    />
                    {showAlbumValidation && (
                      <FieldValidation
                        error={albumValidation.name.errors[0]}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newAlbum.description}
                      onChange={(e) => {
                        setNewAlbum({ ...newAlbum, description: e.target.value });
                        if (showAlbumValidation) {
                          const descriptionValidation = validateAlbumDescription(e.target.value);
                          setAlbumValidation(prev => ({ ...prev, description: descriptionValidation }));
                        }
                      }}
                      placeholder="Enter album description (optional)"
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 font-medium bg-white resize-none transition-colors ${
                        showAlbumValidation && !albumValidation.description.isValid
                          ? 'border-red-300 bg-red-50'
                          : 'border-slate-300'
                      }`}
                    />
                    {showAlbumValidation && (
                      <FieldValidation
                        error={albumValidation.description.errors[0]}
                      />
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newAlbum.isPublic}
                        onChange={(e) => setNewAlbum({ ...newAlbum, isPublic: e.target.checked })}
                        className="w-5 h-5 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-700">Public Album</span>
                        <p className="text-xs text-slate-500 mt-1">Guests can view and upload photos to this album</p>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cover Photo (Optional)
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200">
                      {newAlbum.coverImage ? (
                        <div className="space-y-3">
                          <img
                            src={newAlbum.coverImage}
                            alt="Cover preview"
                            className="w-24 h-24 object-cover rounded-xl mx-auto shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => setNewAlbum({ ...newAlbum, coverImage: undefined })}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Remove Photo
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto">
                            <Upload className="text-slate-400" size={24} />
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">
                              <span className="text-blue-600 font-medium">Click to upload</span> cover photo
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              PNG, JPG, GIF up to 10MB
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
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
                            className="cursor-pointer inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors text-sm font-medium"
                          >
                            Choose File
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() => setShowCreateAlbumModal(false)}
                  className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAlbum}
                  disabled={isCreatingAlbum || !newAlbum.name.trim() || (showAlbumValidation && (!albumValidation.name.isValid || !albumValidation.description.isValid))}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl order-1 sm:order-2"
                >
                  {isCreatingAlbum ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Create Album</span>
                      <Image size={16} />
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multi-Add Album Modal */}
      <AnimatePresence>
        {showMultiAddAlbumModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto"
            onClick={() => setShowMultiAddAlbumModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-4xl my-4 shadow-2xl border border-slate-200 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Image className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Create Multiple Albums</h3>
                      <p className="text-sm text-slate-600">Create up to 10 albums at once for your wedding</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMultiAddAlbumModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* QR Configuration Indicator */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Palette className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-blue-800">
                        QR Code Style: <span className="capitalize text-blue-700">
                          {qrConfig.centerType === 'none' ? 'Plain QR Code' :
                            qrConfig.centerType === 'logo' ? 'With Logo' :
                              `With Monogram (${qrConfig.centerOptions.monogram})`}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        All albums will use your current QR configuration. Change it in QR Settings if needed.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Albums List */}
                <div className="space-y-6">
                  {multiAlbums.map((album, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-50 rounded-xl p-6 border border-slate-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-slate-800">Album {index + 1}</h4>
                        {multiAlbums.length > 1 && (
                          <button
                            onClick={() => removeAlbumFromMultiAdd(index)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove Album"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Album Name *
                          </label>
                          <input
                            type="text"
                            value={album.name}
                            onChange={(e) => updateMultiAlbum(index, 'name', e.target.value)}
                            placeholder="Enter album name"
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 font-medium bg-white transition-colors ${
                              showMultiAlbumValidation && !multiAlbumValidation[index]?.name.isValid
                                ? 'border-red-300 bg-red-50'
                                : 'border-slate-300'
                            }`}
                          />
                          {showMultiAlbumValidation && multiAlbumValidation[index] && (
                            <FieldValidation
                              error={multiAlbumValidation[index].name.errors[0]}
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Description
                          </label>
                          <textarea
                            value={album.description}
                            onChange={(e) => updateMultiAlbum(index, 'description', e.target.value)}
                            placeholder="Enter album description (optional)"
                            rows={3}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 font-medium bg-white resize-none transition-colors ${
                              showMultiAlbumValidation && multiAlbumValidation[index] && !multiAlbumValidation[index].description.isValid
                                ? 'border-red-300 bg-red-50'
                                : 'border-slate-300'
                            }`}
                          />
                          {showMultiAlbumValidation && multiAlbumValidation[index] && (
                            <FieldValidation
                              error={multiAlbumValidation[index].description.errors[0]}
                            />
                          )}
                        </div>
                      </div>

                      {/* Cover Photo Section */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Cover Photo (Optional)
                        </label>
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-200">
                          {album.coverImage ? (
                            <div className="space-y-3">
                              <img
                                src={album.coverImage}
                                alt="Cover preview"
                                className="w-20 h-20 object-cover rounded-xl mx-auto shadow-md"
                              />
                              <button
                                type="button"
                                onClick={() => updateMultiAlbum(index, 'coverImage', undefined)}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                              >
                                Remove Photo
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto">
                                <Upload className="text-slate-400" size={20} />
                              </div>
                              <div>
                                <p className="text-sm text-slate-600">
                                  <span className="text-purple-600 font-medium">Click to upload</span> cover photo
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  PNG, JPG, GIF up to 10MB
                                </p>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                      updateMultiAlbum(index, 'coverImage', e.target?.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                                id={`multi-cover-photo-upload-${index}`}
                              />
                              <label
                                htmlFor={`multi-cover-photo-upload-${index}`}
                                className="cursor-pointer inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors text-sm font-medium"
                              >
                                Choose File
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={album.isPublic}
                            onChange={(e) => updateMultiAlbum(index, 'isPublic', e.target.checked)}
                            className="w-5 h-5 text-purple-600 bg-white border-slate-300 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <div>
                            <span className="text-sm font-medium text-slate-700">Public Album</span>
                            <p className="text-xs text-slate-500 mt-1">Guests can view and upload photos to this album</p>
                          </div>
                        </label>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Add Album Button */}
                {multiAlbums.length < 10 && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={addAlbumToMultiAdd}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Plus size={20} />
                      <span>Add Another Album</span>
                    </button>
                    <p className="text-xs text-slate-500 mt-2">
                      You can create up to {10 - multiAlbums.length} more albums
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() => setShowMultiAddAlbumModal(false)}
                  className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMultiAlbums}
                  disabled={isCreatingMultiAlbums || multiAlbums.some(album => !album.name.trim()) || (showMultiAlbumValidation && multiAlbumValidation.some(validation => !validation.name.isValid || !validation.description.isValid))}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl order-1 sm:order-2"
                >
                  {isCreatingMultiAlbums ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                      <span>Creating Albums...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Create {multiAlbums.length} Albums</span>
                      <Image size={16} />
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Modern Create Invitation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-lg my-4 shadow-2xl border border-slate-200 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <Mail className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Create New Invitation</h3>
                      <p className="text-sm text-slate-600">Send a personalized wedding invitation</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* QR Configuration Indicator */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Palette className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-blue-800">
                        QR Code Style: <span className="capitalize text-blue-700">
                          {qrConfig.centerType === 'none' ? 'Plain QR Code' :
                            qrConfig.centerType === 'logo' ? 'With Logo' :
                              `With Monogram (${qrConfig.centerOptions.monogram})`}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        This invitation will use your current QR configuration. Change it in QR Settings if needed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Guest Name *
                    </label>
                    <input
                      type="text"
                      value={newInvitation.guestName}
                      onChange={(e) => {
                        setNewInvitation({ ...newInvitation, guestName: e.target.value });
                        if (showInvitationValidation) {
                          const nameValidation = validateGuestName(e.target.value);
                          setInvitationValidation(prev => ({ ...prev, guestName: nameValidation }));
                        }
                      }}
                      placeholder="Enter guest name"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 font-medium bg-white transition-colors ${
                        showInvitationValidation && !invitationValidation.guestName.isValid
                          ? 'border-red-300 bg-red-50'
                          : 'border-slate-300'
                      }`}
                    />
                    {showInvitationValidation && (
                      <FieldValidation
                        error={invitationValidation.guestName.errors[0]}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Guest Role
                    </label>
                    <select
                      value={newInvitation.guestRole}
                      onChange={(e) => setNewInvitation({ ...newInvitation, guestRole: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 font-medium bg-white"
                    >
                      {entourageRoles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Custom Message *
                    </label>
                    <div className="relative">
                      <textarea
                        value={newInvitation.customMessage}
                        onChange={(e) => {
                          setNewInvitation({ ...newInvitation, customMessage: e.target.value });
                          if (showInvitationValidation) {
                            const messageValidation = validateInvitationMessage(e.target.value);
                            setInvitationValidation(prev => ({ ...prev, customMessage: messageValidation }));
                          }
                        }}
                        placeholder="Enter personalized message for the guest"
                        rows={4}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 font-medium bg-white resize-none transition-colors ${
                          showInvitationValidation && !invitationValidation.customMessage.isValid
                            ? 'border-red-300 bg-red-50'
                            : 'border-slate-300'
                        }`}
                        required
                        maxLength={1000}
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">
                        {newInvitation.customMessage.length}/1000
                      </div>
                    </div>
                    {showInvitationValidation && (
                      <FieldValidation
                        error={invitationValidation.customMessage.errors[0]}
                      />
                    )}

                    {/* Modern Suggested Messages */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-slate-700">Suggested messages:</p>
                        <button
                          type="button"
                          onClick={() => setNewInvitation({ ...newInvitation, customMessage: '' })}
                          className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
                        {suggestedMessages.map((message, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSelectSuggestedMessage(message)}
                            className="text-left p-3 text-xs bg-white hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors hover:border-emerald-300 font-medium"
                          >
                            {message.length > 80 ? `${message.substring(0, 80)}...` : message}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Invitation Type
                    </label>
                    <select
                      value={newInvitation.invitationType}
                      onChange={(e) => setNewInvitation({ ...newInvitation, invitationType: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 font-medium bg-white"
                    >
                      <option value="personalized">📝 Personalized</option>
                      <option value="general">📋 General</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreatingInvitation}
                  className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInvitation}
                  disabled={isCreatingInvitation || !newInvitation.guestName.trim() || !newInvitation.customMessage.trim() || (showInvitationValidation && (!invitationValidation.guestName.isValid || !invitationValidation.customMessage.isValid))}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl order-1 sm:order-2"
                >
                  {isCreatingInvitation ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Create Invitation</span>
                      <Mail size={16} />
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Modern QR Configuration Modal */}
      <AnimatePresence>
        {showQRConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={() => setShowQRConfig(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 relative mt-10 sm:mt-0 mb-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <QrCodeIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">QR Code Settings</h3>
                      <p className="text-sm text-slate-600">Customize your QR code appearance</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQRConfig(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {isQRLoading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                      <p className="text-slate-600 font-medium">Saving settings...</p>
                    </div>
                  </div>
                )}
                
                <QRCodeConfig
                  onConfigChange={(cfg) => setQrConfig(cfg)}
                  initialConfig={qrConfig}
                />
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button 
                  onClick={() => setShowQRConfig(false)} 
                  className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => { 
                    setIsQRLoading(true); 
                    try { 
                      await handleSaveQRSettings(); 
                    } finally { 
                      setIsQRLoading(false); 
                    } 
                  }} 
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl order-1 sm:order-2" 
                  disabled={isQRLoading}
                >
                  {isQRLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Save Settings</span>
                      <CheckCircle size={16} />
                    </div>
                  )}
                </button>
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
                    src={getFullSizeDisplayUrl(selectedMedia.url, selectedMedia.googleDriveFileId, selectedMedia.mediaType)}
                    alt={selectedMedia.originalName}
                    className="max-w-none max-h-none w-auto h-auto object-contain"
                    style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                  />
                ) : (
                  <div className="max-w-4xl max-h-[90vh] bg-gray-900 rounded-lg overflow-hidden">
                    {showVideoPlayer ? (
                      /* Video Player Mode */
                      <div className="relative">
                        <iframe
                          src={getVideoPlaybackUrl(selectedMedia.url, selectedMedia.googleDriveFileId)}
                          className="w-full h-[70vh]"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          title={selectedMedia.originalName}
                        />
                        
                        {/* Video Controls */}
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button
                            onClick={() => setShowVideoPlayer(false)}
                            className="bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-colors"
                            title="Back to preview"
                          >
                            <X size={20} />
                          </button>
                        </div>
                        
                        {/* Video Info Bar */}
                        <div className="bg-gray-800 p-4 text-white">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold">{selectedMedia.originalName}</h3>
                              {selectedMedia.uploadedBy && (
                                <p className="text-sm text-gray-300">Uploaded by {selectedMedia.uploadedBy}</p>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => window.open(getVideoDownloadUrl(selectedMedia.url, selectedMedia.googleDriveFileId), '_blank')}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                              >
                                <Download size={16} />
                                Download
                              </button>
                              
                              <button
                                onClick={() => {
                                  const url = getVideoPlaybackUrl(selectedMedia.url, selectedMedia.googleDriveFileId);
                                  navigator.clipboard.writeText(url);
                                  toast.success('Video URL copied to clipboard!');
                                }}
                                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1"
                              >
                                <Copy size={16} />
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Video Preview Mode */
                      <div className="flex flex-col items-center justify-center p-8">
                        {/* Video Preview */}
                        <div className="relative mb-6">
                          {selectedMedia.thumbnailUrl ? (
                            <img
                              src={getBestDisplayUrl(selectedMedia.thumbnailUrl, selectedMedia.googleDriveThumbnailId, 600, 'image')}
                              alt={selectedMedia.originalName}
                              className="max-w-md max-h-64 object-cover rounded-lg"
                              onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                          ) : (
                            <div className="w-64 h-36 bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg flex items-center justify-center">
                              <Play className="text-white" size={48} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center">
                            <div className="bg-white bg-opacity-90 rounded-full p-4">
                              <Play className="text-blue-600" size={32} />
                            </div>
                          </div>
                        </div>
                        
                        {/* Video Info */}
                        <div className="text-center text-white mb-6">
                          <h3 className="text-lg font-semibold mb-2">{selectedMedia.originalName}</h3>
                          <p className="text-gray-300 text-sm">Choose how to play this video</p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 justify-center">
                          <button
                            onClick={() => setShowVideoPlayer(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <Play size={20} />
                            Play Here
                          </button>
                          
                          <button
                            onClick={() => window.open(getVideoPlaybackUrl(selectedMedia.url, selectedMedia.googleDriveFileId), '_blank')}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            <ExternalLink size={20} />
                            Open in Tab
                          </button>
                          
                          <button
                            onClick={() => window.open(getVideoDownloadUrl(selectedMedia.url, selectedMedia.googleDriveFileId), '_blank')}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                          >
                            <Download size={20} />
                            Download
                          </button>
                        </div>
                        
                        {/* Alternative URLs */}
                        {selectedMedia.googleDriveFileId && (
                          <div className="mt-6 text-center">
                            <p className="text-gray-400 text-xs mb-2">Alternative options:</p>
                            <div className="flex flex-wrap gap-2 text-xs justify-center">
                              <button
                                onClick={() => window.open(`https://drive.google.com/file/d/${selectedMedia.googleDriveFileId}/view`, '_blank')}
                                className="text-blue-400 hover:text-blue-300 underline"
                              >
                                Google Drive View
                              </button>
                              <span className="text-gray-500">•</span>
                              <button
                                onClick={() => {
                                  const url = getVideoPlaybackUrl(selectedMedia.url, selectedMedia.googleDriveFileId);
                                  navigator.clipboard.writeText(url);
                                  toast.success('URL copied!');
                                }}
                                className="text-blue-400 hover:text-blue-300 underline"
                              >
                                Copy Link
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                    <button
                      key={albumMedia[index]?.id || albumMedia[index]?._id || `nav-${index}`}
                      className={`w-2 h-2 rounded-full ${index === currentMediaIndex ? 'bg-white' : 'bg-white/50'}`}
                      onClick={() => {
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

