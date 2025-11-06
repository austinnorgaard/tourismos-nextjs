// Minimal flat config for ESLint v9 that re-uses eslint-config-next
const nextConfig = require('eslint-config-next');

module.exports = [
  // Spread the shareable Next config into the flat format.
  ...nextConfig,
  {
    ignores: ['node_modules'],
  },
];
