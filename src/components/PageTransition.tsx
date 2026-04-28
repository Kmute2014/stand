import React, { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  pageKey?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, pageKey }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const entranceTimer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => {
      clearTimeout(entranceTimer);
    };
  }, [pageKey]);

  const handleExit = () => {
    setIsExiting(true);
    setTimeout(() => {
      // Allow actual page change to happen
    }, 300);
  };

  return (
    <div
      className={`
        transition-all duration-500 ease-out
        ${isVisible && !isExiting 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-4 scale-95'
        }
      `}
    >
      {children}
    </div>
  );
};

export const SlideTransition: React.FC<{ children: React.ReactNode; direction?: 'left' | 'right' | 'up' | 'down' }> = ({ 
  children, 
  direction = 'right' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const getTransformClasses = () => {
    if (!isVisible) {
      switch (direction) {
        case 'left': return 'translate-x-8';
        case 'right': return 'translate-x-8';
        case 'up': return '-translate-y-8';
        case 'down': return 'translate-y-8';
        default: return 'translate-x-8';
      }
    }
    return 'translate-0';
  };

  return (
    <div
      className={`
        transition-all duration-700 ease-out
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        ${getTransformClasses()}
      `}
    >
      {children}
    </div>
  );
};

export const FadeTransition: React.FC<{ children: React.ReactNode; delay?: number }> = ({ 
  children, 
  delay = 0 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
        transition-opacity duration-1000 ease-out
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {children}
    </div>
  );
};
