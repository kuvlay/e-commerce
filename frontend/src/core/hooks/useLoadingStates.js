import { useState, useEffect } from 'react';

/**
 * Custom hook to manage progressive loading states for better UX
 * Simulates the YouTube-style loading experience with smoother transitions
 */
export const useLoadingStates = (isLoading, sections = []) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [allLoaded, setAllLoaded] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Reset all states when loading starts
      const initialStates = {};
      sections.forEach(section => {
        initialStates[section] = false;
      });
      setLoadingStates(initialStates);
      setAllLoaded(false);
    } else {
      // YouTube-style progressive loading with longer, smoother intervals
      let delay = 400; // Start after 400ms to let skeleton settle
      const loadingInterval = 600; // 600ms between each section for smoother feel

      sections.forEach((section, index) => {
        setTimeout(() => {
          setLoadingStates(prev => ({
            ...prev,
            [section]: true
          }));

          // Check if this is the last section
          if (index === sections.length - 1) {
            setTimeout(() => setAllLoaded(true), 300); // Extra delay for final transition
          }
        }, delay);
        
        delay += loadingInterval;
      });
    }
  }, [isLoading, sections.join(',')]);

  return {
    loadingStates,
    allLoaded,
    isLoading: isLoading || !allLoaded
  };
};

/**
 * Hook for skeleton loading with minimum display time
 * Ensures skeleton is shown for at least minTime milliseconds (YouTube-style)
 */
export const useSkeletonLoading = (isLoading, minTime = 1200) => {
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!isLoading) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minTime - elapsed);
      
      // Add a smooth transition delay
      setTimeout(() => {
        setShowSkeleton(false);
      }, remaining + 200); // Extra 200ms for smoother transition
    }
  }, [isLoading, minTime, startTime]);

  return showSkeleton || isLoading;
};

export default { useLoadingStates, useSkeletonLoading };