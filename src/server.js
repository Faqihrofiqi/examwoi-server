// src/server.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Version: ${process.env.API_VERSION}`);
});
