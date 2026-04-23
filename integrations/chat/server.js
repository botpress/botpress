const server = require("./index.cjs");

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8081;
server.default.start(port);
