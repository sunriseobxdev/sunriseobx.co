// Swiper v11+ imports - modules are imported from separate paths
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/grid';
import 'swiper/css/effect-creative';
import 'swiper/css/virtual';
import 'swiper/css/thumbs';
import 'swiper/css/scrollbar';

export const sliderProps = {
  heroSlider: {
    modules: [Navigation, Autoplay],
    slidesPerView: 1,
    spaceBetween: 0,
    speed: 800,
    autoplay: {
      delay: 5000,
    },
    parallax: true,
    loop: true,
    navigation: {
      prevEl: ".swiper-nav-prev",
      nextEl: ".swiper-nav-next",
    },
  },
  hero2Slider: {
    modules: [Navigation, Autoplay],
    slidesPerView: 1,
    spaceBetween: 0,
    speed: 800,
    autoplay: {
      delay: 5000,
    },
    parallax: true,
    loop: false,
    navigation: {
      prevEl: ".f-2-s-nav .swiper-nav-prev",
      nextEl: ".f-2-s-nav .swiper-nav-next",
    },
  },
  partnersSlider: {
    modules: [Autoplay],
    slidesPerView: 3,
    spaceBetween: 0,
    speed: 800,
    autoplay: {
      delay: 4000,
    },
  },
  testimonialSlider: {
    modules: [Pagination, Autoplay],
    slidesPerView: 1,
    spaceBetween: 30,
    speed: 800,
    autoplay: {
      delay: 6000,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
  },
  projectsSlider: {
    modules: [Pagination, Autoplay],
    slidesPerView: 4,
    spaceBetween: 20,
    speed: 800,
    autoplay: {
      delay: 4000,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
  },
  projects2Slider: {
    modules: [Navigation, Autoplay, EffectFade],
    slidesPerView: 1,
    spaceBetween: 30,
    speed: 800,
    effect: 'fade',
    fadeEffect: {
      crossFade: true
    },
    autoplay: {
      delay: 4000,
    },
    navigation: {
      prevEl: ".prj-slider-nav .swiper-nav-prev",
      nextEl: ".prj-slider-nav .swiper-nav-next",
    },
  },
  teamSlider: {
    modules: [Navigation],
    slidesPerView: 'auto',
    spaceBetween: 30,
    speed: 800,
    loop: true,
    centeredSlides: true,
    navigation: {
      prevEl: ".team-slider-nav .swiper-nav-prev",
      nextEl: ".team-slider-nav .swiper-nav-next",
    },
  },
  certificatesSlider: {
    modules: [Navigation, Autoplay],
    slidesPerView: 1,
    spaceBetween: 30,
    speed: 800,
    loop: true,
    autoplay: {
      delay: 5000,
    },
    navigation: {
      prevEl: ".c-slider .swiper-nav-prev",
      nextEl: ".c-slider .swiper-nav-next",
    },
  },
  blogSlider: {
    modules: [Pagination, Autoplay],
    slidesPerView: 3,
    spaceBetween: 10,
    speed: 800,
    autoplay: {
      delay: 5000,
    },
    loop: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
  },
  productsSlider: {
    modules: [Pagination, Autoplay],
    slidesPerView: 3,
    spaceBetween: 0,
    speed: 800,
    autoplay: {
      delay: 5000,
    },
    loop: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
  },
  projDetailsSlider: {
    modules: [Pagination, Autoplay],
    slidesPerView: 1,
    spaceBetween: 0,
    speed: 800,
    autoplay: {
      delay: 5000,
    },
    loop: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
  },
};
