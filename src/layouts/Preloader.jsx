// Preloader Component - Sunrise Construction Theme
// Features: Fade in/out sunrise animation with rotating sun rays against sea horizon
// Updated: Replaced static logo with CSS-only sunrise animation for less disruptive loading

const Preloader = () => {
  return (
    <div className="preloader">
      <div className="sunrise-container">
        {/* Sea horizon background */}
        <div className="sea-horizon"></div>
        
        {/* Sun with rotating rays */}
        <div className="sun-container">
          <div className="sun">
            {/* Sun rays */}
            <div className="sun-rays">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`ray ray-${i + 1}`}></div>
              ))}
            </div>
            {/* Sun core */}
            <div className="sun-core"></div>
          </div>
        </div>
        
        {/* Optional loading text */}
        <div className="loading-text">
          <span>Sunrise Construction</span>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
