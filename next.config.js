const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['ai'],
    webpack: (config) => {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@lib': path.resolve(__dirname, 'lib'),
      }
      return config
    },
  }
  
  module.exports = nextConfig