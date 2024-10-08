/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://sunriseobx.co',
  generateRobotsTxt: true, // (optional)
  exclude: [
    '/team',
    '/projects',
    '/projects-2',
    '/product-list',
    '/product-grid',
    '/product-details',
    '/login',
    '/leadership',
    '/history',
    '/core-values',
    '/checkout',
    '/cart',
    '/blog-2',
    '/team/*',
    '/projects/*',
    '/product-detail'
  ]
  // ...other options
}