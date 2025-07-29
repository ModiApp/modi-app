module.exports = function (api) {
  api.cache(true);
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Remove console statements in production (except error and warn)
      ...(isProduction ? [
        ['transform-remove-console', { 
          exclude: ['error', 'warn', 'info'] 
        }]
      ] : [])
    ],
  };
}; 