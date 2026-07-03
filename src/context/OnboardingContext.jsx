import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children, session, dataLoading, brand }) {
  const [onboardingNeeded, setOnboardingNeeded] = useState(false);
  const onboardingRef = useRef(null);

  useEffect(() => {
    if (!session) {
      onboardingRef.current = null;
      setOnboardingNeeded(false);
      return;
    }
    if (dataLoading) return;

    var meta2 = session.user.user_metadata || {};
    var gName = meta2.full_name || meta2.name || '';
    var doneFlag = !!localStorage.getItem('financia_onboarded_' + session.user.id);
    var needName = !!gName && brand.name === gName;
    var needs = !doneFlag && needName;

    if (onboardingRef.current === null) {
      onboardingRef.current = needs;
      setOnboardingNeeded(needs);
    } else if (onboardingRef.current === true && !needs) {
      onboardingRef.current = false;
      setOnboardingNeeded(false);
    }
  }, [session, dataLoading, brand]);

  const finishOnboarding = useCallback(async (data, { needsName, saveBrand, savePhone, uid }) => {
    var tasks = [];
    if (needsName && data.name) {
      var nb = Object.assign({}, brand, { name: data.name });
      tasks.push(Promise.resolve(saveBrand(nb)));
    }
    if (data.phone) tasks.push(Promise.resolve(savePhone(data.phone)));
    return Promise.all(tasks).then(() => {
      localStorage.setItem('financia_onboarded_' + uid, '1');
      onboardingRef.current = false;
      setOnboardingNeeded(false);
    });
  }, [brand]);

  return (
    <OnboardingContext.Provider value={{ onboardingNeeded, finishOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}