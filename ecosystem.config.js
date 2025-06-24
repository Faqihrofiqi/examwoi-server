module.exports = {
  apps: [
    {
      name: 'api',
      script: './api/src/server.js',
      watch: false,
    },
    {
      name: 'frontend',
      script: 'npx serve -s ./frontend/build -l 80800',
      watch: false,
    },
  ],
}
