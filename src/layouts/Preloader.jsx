// Preloader Component - Sunrise Construction Theme
// Features: Small centered sunrise spinner with rotating sun rays
// Updated: Compact spinner design instead of fullscreen loader for less disruption

const Preloader = () => {
  return (
    <div className="preloader">
      <div className="sunrise-spinner">
        {/* Sun with rotating rays */}
        <div className="sun-container">
          <div className="sun">
            {/* Sun rays */}
            <div className="sun-rays">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`ray ray-${i + 1}`}></div>
              ))}
            </div>
            {/* Sun core */}
            <div className="sun-core"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
