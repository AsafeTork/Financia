import { useCallback, useEffect } from 'react';

export function useOnboarding({ session, dataLoading, brand, setOnboardingNeeded, onboardingRef, saveBrand, savePhone }) {
  useEffect(function() {
    if (!session) { onboardingRef.current = null; setOnboardingNeeded(false); return; }
    if (dataLoading) return;
    const meta2 = session.user.user_metadata || {};
    const gName = meta2.full_name || meta2.name || '';
    const doneFlag = !!localStorage.getItem('financia_onboarded_' + session.user.id);
    const needName = !!gName && brand.name === gName;
    const needs = !doneFlag && needName;
    if (onboardingRef.current === null) {
      onboardingRef.current = needs;
      setOnboardingNeeded(needs);
    } else if (onboardingRef.current === true && !needs) {
      onboardingRef.current = false;
      setOnboardingNeeded(false);
    }
  }, [session, dataLoading, brand, setOnboardingNeeded, onboardingRef]);

  const finishOnboarding = useCallback(function(data, needsName) {
    const tasks = [];
    if (needsName && data.name) {
      const nb = Object.assign({}, brand, {name: data.name});
      tasks.push(Promise.resolve(saveBrand(nb)));
    }
    if (data.phone) tasks.push(Promise.resolve(savePhone(data.phone)));
    return Promise.all(tasks).then(function() {
      localStorage.setItem('financia_onboarded_' + session.user.id, '1');
      onboardingRef.current = false;
      setOnboardingNeeded(false);
    });
  }, [session, brand, saveBrand, savePhone, onboardingRef, setOnboardingNeeded]);

  return { onboardingRef, finishOnboarding };
}