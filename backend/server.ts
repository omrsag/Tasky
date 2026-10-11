import express = require("express");

const app = express();

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`Tasky backend running on port ${PORT}`);
});