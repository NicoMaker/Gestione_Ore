// Entry point del server.
const app = require("./src/app.js");
const { port } = require("./src/config/env.js");

console.log("Porta: " + port);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
