// .lighthouseci.config.js
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      aggregationMethod: 'median',
      url: process.env.CI_URL || 'http://localhost:5173',
    },
    assert: {
      assert: 'regular',
      assertions: {
        'categories:performance': ['p90', '> 90'],
        'categories:accessibility': ['p90', '> 90'],
        'categories:best-practice': ['p90', '> 90'],
        'categories:seo': ['p90', '> 80'],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    server: {
      port: 35272,
      address: 'localhost',
      open: false,
    },
  },
};
