import { useCallback, useRef, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import Link from 'next/link';
import Image from 'next/image';

import { sliderProps } from '@common/sliderProps';
import { useScrollAnimation } from '@common/hooks/useScrollAnimation';
import Data from '@data/sliders/hero';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const HeroSlider = ({
  autoplay = true,
  autoplayDelay = 5000,
  showNavigation = true,
  showPagination = true,
  effect = 'fade',
  className = '',
}) => {
  const swiperRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { ref: animationRef } = useScrollAnimation({ threshold: 0.1 });

  // Enhanced slider configuration
  const sliderConfig = {
    ...sliderProps.heroSlider,
    modules: [Navigation, Pagination, Autoplay, EffectFade],
    effect,
    autoplay: autoplay ? {
      delay: autoplayDelay,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    } : false,
    navigation: showNavigation ? {
      nextEl: '.swiper-nav-next',
      prevEl: '.swiper-nav-prev',
    } : false,
    pagination: showPagination ? {
      el: '.swiper-pagination',
      clickable: true,
      renderBullet: (index, className) => {
        return `<span class="${className}" aria-label="Go to slide ${index + 1}"></span>`;
      },
    } : false,
    on: {
      init: () => setIsLoaded(true),
      slideChange: (swiper) => setCurrentSlide(swiper.activeIndex),
    },
    a11y: {
      prevSlideMessage: 'Previous slide',
      nextSlideMessage: 'Next slide',
      firstSlideMessage: 'This is the first slide',
      lastSlideMessage: 'This is the last slide',
    },
  };

  const handlePrevSlide = useCallback(() => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  }, []);

  const handleNextSlide = useCallback(() => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  }, []);

  // Pause autoplay when user prefers reduced motion
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion && swiperRef.current?.autoplay) {
      swiperRef.current.autoplay.stop();
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      } else if (e.key === 'ArrowRight') {
        handleNextSlide();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePrevSlide, handleNextSlide]);

  if (!Data?.items?.length) {
    return (
      <section className="hero-fallback">
        <div className="container">
          <div className="hero-content">
            <h1>Welcome to Sunrise Construction</h1>
            <p>Elite-tier construction services for homeowners nationwide.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={animationRef}
      className={`featured-slider-one hero-slider ${className}`}
      role="banner"
      aria-label="Hero slider showcasing our services"
    >
      <div className="container-fluid">
        <Swiper
          {...sliderConfig}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          className={`swiper-container hero-swiper ${isLoaded ? 'loaded' : ''}`}
        >
          {Data.items.map((item, index) => (
            <SwiperSlide
              key={`hero-slide-${index}`}
              className="swiper-slide hero-slide"
            >
              <div className="hero-slide-content">
                {/* Background Image */}
                <div className="hero-image-wrapper">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    priority={index === 0} // Prioritize first image
                    quality={90}
                    sizes="100vw"
                    className="hero-background-image"
                    onLoad={() => {
                      if (index === 0) setIsLoaded(true);
                    }}
                  />
                  <div className="hero-overlay" />
                </div>

                {/* Content */}
                <div className="hero-content-wrapper">
                  <div className="container">
                    <div className="row justify-content-center">
                      <div className="col-lg-8 col-md-10">
                        <div className="hero-content text-center">
                          <h1 className="hero-title">
                            {item.title}
                          </h1>
                          {item.text && (
                            <p className="hero-description">
                              {item.text}
                            </p>
                          )}
                          {item.button && (
                            <div className="hero-actions">
                              <Link
                                href={item.button.link}
                                className="theme-btn hero-cta"
                                aria-label={`${item.button.label} - Learn more about our services`}
                              >
                                <span>{item.button.label}</span>
                                <i className="fa-solid fa-angles-right" aria-hidden="true" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}

          {/* Navigation */}
          {showNavigation && (
            <div className="swiper-navigation">
              <button
                className="swiper-nav-prev"
                onClick={handlePrevSlide}
                aria-label="Previous slide"
                type="button"
              >
                <i className="fa-solid fa-angles-left" aria-hidden="true" />
              </button>
              <button
                className="swiper-nav-next"
                onClick={handleNextSlide}
                aria-label="Next slide"
                type="button"
              >
                <i className="fa-solid fa-angles-right" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Pagination */}
          {showPagination && (
            <div className="swiper-pagination" />
          )}
        </Swiper>

        {/* Slide Counter */}
        <div className="slide-counter" aria-live="polite">
          <span className="sr-only">
            Slide {currentSlide + 1} of {Data.items.length}
          </span>
          <span aria-hidden="true">
            {String(currentSlide + 1).padStart(2, '0')} / {String(Data.items.length).padStart(2, '0')}
          </span>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;