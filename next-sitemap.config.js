/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://sunriseobx.co',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ['/admin/*', '/api/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    additionalSitemaps: [
      'https://sunriseobx.co/sitemap.xml',
    ],
  },
  transform: async (config, path) => {
    // Custom priority and changefreq for different pages
    const customConfig = {
      loc: path,
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date().toISOString(),
    }

    // Higher priority for important pages
    if (path === '/') {
      customConfig.priority = 1.0
      customConfig.changefreq = 'daily'
    }
    
    if (path.includes('/services/')) {
      customConfig.priority = 0.9
      customConfig.changefreq = 'weekly'
    }
    
    if (path.includes('/projects/')) {
      customConfig.priority = 0.8
      customConfig.changefreq = 'monthly'
    }

    return customConfig
  },
  additionalPaths: async (config) => {
    const result = []

    // Add custom paths for services
    const services = [
      'wincore-windows-outer-banks',
      'fortified-roofing-outer-banks',
      'exterior-construction-outer-banks'
    ]

    services.forEach((service) => {
      result.push({
        loc: `/services/${service}`,
        changefreq: 'weekly',
        priority: 0.9,
        lastmod: new Date().toISOString(),
      })
    })

    // Add custom paths for locations
    const locations = [
      'nags-head-construction',
      'duck-construction',
      'kitty-hawk-construction',
      'kill-devil-hills-construction',
      'manteo-construction',
      'hatteras-construction'
    ]

    locations.forEach((location) => {
      result.push({
        loc: `/locations/${location}`,
        changefreq: 'monthly',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      })
    })

    return result
  },
}