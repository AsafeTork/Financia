import { useState, useCallback, useRef } from 'react';
import { INIT_BRAND, INIT_PLAN } from '../../lib/constants.js';

export function useAppState() {
  const [session, setSession] = useState(null);
  const [isAdminDB, setIsAdminDB] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [brand, setBrand] = useState(INIT_BRAND);
  const [planInfo, setPlanInfo] = useState(INIT_PLAN);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [toasts, setToasts] = useState([]);
  const [confirmData, setConfirmData] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [onboardingNeeded, setOnboardingNeeded] = useState(false);
  const [announceMsg, setAnnounceMsg] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const setBrandStable = useCallback(function(next) {
    setBrand(function(prev) {
      if (!prev && !next) return prev;
      if (!prev) return next;
      if (!next) return prev;
      if (prev.name===next.name && prev.logo===next.logo && prev.color===next.color && prev.color_secondary===next.color_secondary && prev.color_accent===next.color_accent && prev.theme===next.theme && prev.logo_url===next.logo_url && prev.phone===next.phone && prev.white_label===next.white_label && prev.niche===next.niche && prev.visual_version===next.visual_version && prev.custom_palette===next.custom_palette && prev.brand_config===next.brand_config) return prev;
      return next;
    });
  }, [setBrand]);

  const firstRender = useRef(true);
  const onboardingRef = useRef(null);
  const toastId = useRef(0);
  const toastTimeoutsRef = useRef([]);
  const modalRef = useRef({ confirmData: null, showUpgrade: false, sidebarOpen: false, showLogin: false });
  modalRef.current = { confirmData, showUpgrade, sidebarOpen, showLogin };

  return {
    session, setSession,
    isAdminDB, setIsAdminDB,
    appLoading, setAppLoading,
    dataLoading, setDataLoading,
    dataError, setDataError,
    brand, setBrand, setBrandStable,
    planInfo, setPlanInfo,
    syncStatus, setSyncStatus,
    toasts, setToasts,
    confirmData, setConfirmData,
    showLogin, setShowLogin,
    showUpgrade, setShowUpgrade,
    onboardingNeeded, setOnboardingNeeded,
    announceMsg, setAnnounceMsg,
    sidebarOpen, setSidebarOpen,
    firstRender,
    onboardingRef,
    toastId,
    toastTimeoutsRef,
    modalRef,
  };
}