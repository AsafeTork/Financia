module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npm run preview',
      url: ['http://localhost:4173'],
      settings: {
        preset: 'desktop',
        staticDistDir: './dist',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'categories:pwa': ['error', { minScore: 0.8 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
        'max-potential-fid': ['warn', { maxNumericValue: 100 }],
        'first-meaningful-paint': ['warn', { maxNumericValue: 2000 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'resource-summary:total': ['error', { maxNumericValue: 800000 }],
        'resource-summary:script': ['error', { maxNumericValue: 260000 }],
        'resource-summary:css': ['warn', { maxNumericValue: 70000 }],
        'resource-summary:image': ['warn', { maxNumericValue: 200000 }],
        'resource-summary:font': ['warn', { maxNumericValue: 40000 }],
        'resource-summary:third-party': ['error', { maxNumericValue: 100000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    server: {
      command: 'npm run preview',
      port: 4173,
    },
  },
};