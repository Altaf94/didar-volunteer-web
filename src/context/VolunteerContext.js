// ============================================
// VOLUNTEER MANAGEMENT SYSTEM - CONTEXT
// Didar Mubarak Pakistan
// ============================================

import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from 'react';
import volunteerApiService from '../services/volunteerApi';
import {
  UserRole,
  UserLevel,
} from '../types/volunteer';
import { EVENTS, DUTY_TYPES } from '../constants/volunteerConstants';

// ============================================
// DEFAULT VALUES
// ============================================

const defaultFilters = {
  page: 1,
  pageSize: 20,
};

const defaultContextValue = {
  userRole: UserRole.VIEW_ONLY,
  userLevel: UserLevel.REGIONAL,
  userRegion: undefined,
  
  volunteers: [],
  volunteersLoading: false,
  volunteersError: null,
  volunteersTotal: 0,
  volunteersPage: 1,
  
  uploadBatches: [],
  uploadBatchesLoading: false,
  currentUploadBatch: null,
  
  printBatches: [],
  printBatchesLoading: false,
  currentPrintBatch: null,
  
  dispatchPackages: [],
  dispatchPackagesLoading: false,
  
  dashboardStats: null,
  dashboardLoading: false,
  
  events: EVENTS,
  dutyTypes: DUTY_TYPES,
  localCouncils: [],
  jamatKhanas: [],
  
  selectedVolunteers: [],
  currentFilters: defaultFilters,
  
  loadVolunteers: async () => {},
  loadMoreVolunteers: async () => {},
  refreshVolunteers: async () => {},
  uploadVolunteerData: async () => ({}),
  loadUploadBatches: async () => {},
  approveVolunteers: async () => {},
  submitVolunteers: async () => {},
  createPrintBatch: async () => ({}),
  printBadges: async () => {},
  generateCoveringSheet: async () => [],
  prepareDispatchPackage: async () => ({}),
  dispatchPackage: async () => {},
  loadDispatchPackages: async () => {},
  loadDashboardStats: async () => {},
  loadMasterData: async () => {},
  loadLocalCouncils: async () => {},
  loadJamatKhanas: async () => {},
  selectVolunteer: () => {},
  deselectVolunteer: () => {},
  selectAllVolunteers: () => {},
  deselectAllVolunteers: () => {},
  setFilters: () => {},
  clearFilters: () => {},
  setUserRole: () => {},
  setUserLevel: () => {},
  setUserRegion: () => {},
};

// ============================================
// CONTEXT CREATION
// ============================================

const VolunteerContext = createContext(defaultContextValue);

export const VolunteerProvider = ({ children }) => {
  // User state
  const [userRole, setUserRole] = useState(UserRole.VIEW_ONLY);
  const [userLevel, setUserLevel] = useState(UserLevel.REGIONAL);
  const [userRegion, setUserRegion] = useState(undefined);
  
  // Volunteers state
  const [volunteers, setVolunteers] = useState([]);
  const [volunteersLoading, setVolunteersLoading] = useState(false);
  const [volunteersError, setVolunteersError] = useState(null);
  const [volunteersTotal, setVolunteersTotal] = useState(0);
  const [volunteersPage, setVolunteersPage] = useState(1);
  
  // Upload batches state
  const [uploadBatches, setUploadBatches] = useState([]);
  const [uploadBatchesLoading, setUploadBatchesLoading] = useState(false);
  const [currentUploadBatch, setCurrentUploadBatch] = useState(null);
  
  // Print batches state
  const [printBatches, setPrintBatches] = useState([]);
  const [printBatchesLoading, setPrintBatchesLoading] = useState(false);
  const [currentPrintBatch, setCurrentPrintBatch] = useState(null);
  
  // Dispatch packages state
  const [dispatchPackages, setDispatchPackages] = useState([]);
  const [dispatchPackagesLoading, setDispatchPackagesLoading] = useState(false);
  
  // Dashboard state
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  // Master data state
  const [events] = useState(EVENTS);
  const [dutyTypes] = useState(DUTY_TYPES);
  const [localCouncils, setLocalCouncils] = useState([]);
  const [jamatKhanas, setJamatKhanas] = useState([]);
  
  // Selection state
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const [currentFilters, setCurrentFilters] = useState(defaultFilters);

  // ============================================
  // VOLUNTEER ACTIONS
  // ============================================

  const loadVolunteers = useCallback(async (filters = {}) => {
    setVolunteersLoading(true);
    setVolunteersError(null);
    
    try {
      const mergedFilters = { ...currentFilters, ...filters };
      setCurrentFilters(mergedFilters);
      
      const response = await volunteerApiService.getVolunteers(mergedFilters);
      
      setVolunteers(response.data || []);
      setVolunteersTotal(response.pagination?.total || 0);
      setVolunteersPage(response.pagination?.page || 1);
    } catch (error) {
      console.error('Failed to load volunteers:', error);
      setVolunteersError(error.message);
    } finally {
      setVolunteersLoading(false);
    }
  }, [currentFilters]);

  const loadMoreVolunteers = useCallback(async () => {
    const nextPage = volunteersPage + 1;
    setVolunteersLoading(true);
    
    try {
      const response = await volunteerApiService.getVolunteers({
        ...currentFilters,
        page: nextPage,
      });
      
      setVolunteers(prev => [...prev, ...(response.data || [])]);
      setVolunteersPage(nextPage);
    } catch (error) {
      console.error('Failed to load more volunteers:', error);
      setVolunteersError(error.message);
    } finally {
      setVolunteersLoading(false);
    }
  }, [currentFilters, volunteersPage]);

  const refreshVolunteers = useCallback(async () => {
    await loadVolunteers({ page: 1 });
  }, [loadVolunteers]);

  // ============================================
  // UPLOAD ACTIONS
  // ============================================

  const uploadVolunteerData = useCallback(async (uploadResult) => {
    // Upload is now handled by FileUpload component calling local endpoints
    // This function just updates the context state with the result
    setCurrentUploadBatch(uploadResult);
    return uploadResult;
  }, []);

  const loadUploadBatches = useCallback(async (region) => {
    setUploadBatchesLoading(true);
    
    try {
      const batches = await volunteerApiService.getUploadBatches(region || userRegion);
      setUploadBatches(batches);
    } catch (error) {
      console.error('Failed to load upload batches:', error);
    } finally {
      setUploadBatchesLoading(false);
    }
  }, [userRegion]);

  // ============================================
  // APPROVAL ACTIONS
  // ============================================

  const approveVolunteers = useCallback(async (data) => {
    await volunteerApiService.approveVolunteers(data);
    await refreshVolunteers();
  }, [refreshVolunteers]);

  const submitVolunteers = useCallback(async (volunteerIds) => {
    await volunteerApiService.submitVolunteers(volunteerIds);
    await refreshVolunteers();
  }, [refreshVolunteers]);

  // ============================================
  // PRINT ACTIONS
  // ============================================

  const createPrintBatch = useCallback(async (data) => {
    const batch = await volunteerApiService.createPrintBatch(data);
    setCurrentPrintBatch(batch);
    return batch;
  }, []);

  const printBadges = useCallback(async (printBatchId) => {
    await volunteerApiService.printBadges(printBatchId);
  }, []);

  const generateCoveringSheet = useCallback(async (printBatchId) => {
    return await volunteerApiService.generateCoveringSheet(printBatchId);
  }, []);

  // ============================================
  // DISPATCH ACTIONS
  // ============================================

  const prepareDispatchPackage = useCallback(async (data) => {
    return await volunteerApiService.prepareDispatchPackage(data);
  }, []);

  const dispatchPackage = useCallback(async (packageId) => {
    await volunteerApiService.dispatchPackage(packageId);
    await loadDispatchPackages();
  }, []);

  const loadDispatchPackages = useCallback(async (region) => {
    setDispatchPackagesLoading(true);
    
    try {
      const packages = await volunteerApiService.getDispatchPackages(region || userRegion);
      setDispatchPackages(packages);
    } catch (error) {
      console.error('Failed to load dispatch packages:', error);
    } finally {
      setDispatchPackagesLoading(false);
    }
  }, [userRegion]);

  // ============================================
  // DASHBOARD ACTIONS
  // ============================================

  const loadDashboardStats = useCallback(async (filters = {}) => {
    setDashboardLoading(true);
    
    try {
      const stats = await volunteerApiService.getDashboardStats(filters);
      setDashboardStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // ============================================
  // MASTER DATA ACTIONS
  // ============================================

  const loadMasterData = useCallback(async () => {
    await Promise.all([
      loadLocalCouncils(),
      loadJamatKhanas(),
    ]);
  }, []);

  const loadLocalCouncils = useCallback(async (region) => {
    try {
      const councils = await volunteerApiService.getLocalCouncils(region || userRegion);
      setLocalCouncils(councils);
    } catch (error) {
      console.error('Failed to load local councils:', error);
    }
  }, [userRegion]);

  const loadJamatKhanas = useCallback(async (localCouncilId) => {
    try {
      const jks = await volunteerApiService.getJamatKhanas(localCouncilId);
      setJamatKhanas(jks);
    } catch (error) {
      console.error('Failed to load jamat khanas:', error);
    }
  }, []);

  // ============================================
  // SELECTION ACTIONS
  // ============================================

  const selectVolunteer = useCallback((id) => {
    setSelectedVolunteers(prev => [...prev, id]);
  }, []);

  const deselectVolunteer = useCallback((id) => {
    setSelectedVolunteers(prev => prev.filter(v => v !== id));
  }, []);

  const selectAllVolunteers = useCallback(() => {
    setSelectedVolunteers(volunteers.map(v => v.id));
  }, [volunteers]);

  const deselectAllVolunteers = useCallback(() => {
    setSelectedVolunteers([]);
  }, []);

  // ============================================
  // FILTER ACTIONS
  // ============================================

  const setFilters = useCallback((filters) => {
    setCurrentFilters(prev => ({ ...prev, ...filters }));
  }, []);

  const clearFilters = useCallback(() => {
    setCurrentFilters(defaultFilters);
    setSelectedVolunteers([]);
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = {
    userRole,
    userLevel,
    userRegion,
    
    volunteers,
    volunteersLoading,
    volunteersError,
    volunteersTotal,
    volunteersPage,
    
    uploadBatches,
    uploadBatchesLoading,
    currentUploadBatch,
    
    printBatches,
    printBatchesLoading,
    currentPrintBatch,
    
    dispatchPackages,
    dispatchPackagesLoading,
    
    dashboardStats,
    dashboardLoading,
    
    events,
    dutyTypes,
    localCouncils,
    jamatKhanas,
    
    selectedVolunteers,
    currentFilters,
    
    loadVolunteers,
    loadMoreVolunteers,
    refreshVolunteers,
    uploadVolunteerData,
    loadUploadBatches,
    approveVolunteers,
    submitVolunteers,
    createPrintBatch,
    printBadges,
    generateCoveringSheet,
    prepareDispatchPackage,
    dispatchPackage,
    loadDispatchPackages,
    loadDashboardStats,
    loadMasterData,
    loadLocalCouncils,
    loadJamatKhanas,
    selectVolunteer,
    deselectVolunteer,
    selectAllVolunteers,
    deselectAllVolunteers,
    setFilters,
    clearFilters,
    setUserRole,
    setUserLevel,
    setUserRegion,
  };

  return (
    <VolunteerContext.Provider value={value}>
      {children}
    </VolunteerContext.Provider>
  );
};

export const useVolunteer = () => {
  const context = useContext(VolunteerContext);
  if (context === undefined) {
    throw new Error('useVolunteer must be used within a VolunteerProvider');
  }
  return context;
};
