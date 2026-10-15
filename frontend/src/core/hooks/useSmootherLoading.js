import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/**
 * Advanced loading hook that provides smooth loading experience
 * Skips delays when data is cached for instant loading
 */
export const useSmootherLoading = (isLoading, options = {}) => {
  const {
    minLoadingTime = 1500,
    transitionDelay = 300,
    sections = [],
    isCached = false
  } = options;

  const [loadingState, setLoadingState] = useState({
    isLoading: true,
    showSkeleton: true,
    sectionsLoaded: {},
    allSectionsReady: false
  });

  const startTimeRef = useRef(Date.now());
  const timeoutsRef = useRef([]);
  const sectionsRef = useRef(sections);

  // Update sections ref when sections array changes
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  // Clear all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Memoize the initial sections loaded state to prevent recreation
  const initialSectionsState = useMemo(() => 
    sectionsRef.current.reduce((acc, section) => ({ ...acc, [section]: false }), {}),
    [sectionsRef.current.join()] // Only recreate when sections array changes
  );

  // Memoize the all sections loaded state to prevent recreation
  const allSectionsLoadedState = useMemo(() => 
    sectionsRef.current.reduce((acc, section) => ({ ...acc, [section]: true }), {}),
    [sectionsRef.current.join()] // Only recreate when sections array changes
  );

  useEffect(() => {
    if (isLoading) {
      // Reset state when loading starts
      startTimeRef.current = Date.now();
      setLoadingState(prev => ({
        ...prev,
        isLoading: true,
        showSkeleton: true,
        sectionsLoaded: initialSectionsState,
        allSectionsReady: false
      }));
      
      // Clear any existing timeouts
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = [];
    } else {
      // If data is cached, skip all delays and load instantly
      if (isCached) {
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          showSkeleton: false,
          sectionsLoaded: allSectionsLoadedState,
          allSectionsReady: true
        }));
        return;
      }

      // Calculate how long we've been loading
      const elapsedTime = Date.now() - startTimeRef.current;
      const remainingMinTime = Math.max(0, minLoadingTime - elapsedTime);
      const currentSections = sectionsRef.current;

      // Wait for minimum loading time, then start progressive section loading
      const mainTimeout = setTimeout(() => {
        // Start progressive section loading
        let sectionDelay = 0;
        const sectionInterval = 400; // 400ms between sections

        currentSections.forEach((section, index) => {
          const sectionTimeout = setTimeout(() => {
            setLoadingState(prev => {
              // Only update if the section exists in the current state
              if (!prev.sectionsLoaded[section]) {
                return {
                  ...prev,
                  sectionsLoaded: {
                    ...prev.sectionsLoaded,
                    [section]: true
                  }
                };
              }
              return prev;
            });

            // If this is the last section, mark all as ready after transition delay
            if (index === currentSections.length - 1) {
              const finalTimeout = setTimeout(() => {
                setLoadingState(prev => ({
                  ...prev,
                  isLoading: false,
                  showSkeleton: false,
                  allSectionsReady: true
                }));
              }, transitionDelay);
              
              timeoutsRef.current.push(finalTimeout);
            }
          }, sectionDelay);

          timeoutsRef.current.push(sectionTimeout);
          sectionDelay += sectionInterval;
        });

        // If no sections, just finish loading
        if (currentSections.length === 0) {
          const finishTimeout = setTimeout(() => {
            setLoadingState(prev => ({
              ...prev,
              isLoading: false,
              showSkeleton: false,
              allSectionsReady: true
            }));
          }, transitionDelay);
          
          timeoutsRef.current.push(finishTimeout);
        }
      }, remainingMinTime);

      timeoutsRef.current.push(mainTimeout);
    }
  }, [isLoading, minLoadingTime, transitionDelay, isCached, initialSectionsState, allSectionsLoadedState]);

  return loadingState;
};

/**
 * Simple hook for components that just need smooth skeleton loading
 */
export const useSkeletonTransition = (isLoading, minTime = 1200, isCached = false) => {
  const [showSkeleton, setShowSkeleton] = useState(true);
  const startTimeRef = useRef(Date.now());
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clear any existing timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
      setShowSkeleton(true);
      
      // Clear any existing timeout when loading starts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else {
      // If cached, hide skeleton immediately
      if (isCached) {
        setShowSkeleton(false);
        return;
      }

      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, minTime - elapsed);
      
      // Store the timeout ID to clear it if needed
      timeoutRef.current = setTimeout(() => {
        setShowSkeleton(false);
        timeoutRef.current = null;
      }, remaining);
    }
  }, [isLoading, minTime, isCached]);

  return showSkeleton;
};

export default { useSmootherLoading, useSkeletonTransition };