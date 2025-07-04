// Simple Black Fade Preloader
// Features: Clean black fade in/out transition
// Updated: Minimal loading experience

import { useEffect, useState } from 'react';

const Preloader = () => {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Simple timer for fade duration
    const timer = setTimeout(() => {
      setIsComplete(true);
    }, 200); // 200ms fade duration - much shorter

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`preloader ${isComplete ? 'loaded' : ''}`}>
      {/* Simple black overlay - no canvas needed */}
    </div>
  );
};

export default Preloader;
