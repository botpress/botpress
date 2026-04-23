const server = require("./index.cjs");

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8081;
const metricsPort = process.env.METRICS_PORT ? parseInt(process.env.METRICS_PORT, 10) : 9090;

if (process.env.METRICS_ENABLED !== "false") {
  server.default.startMetricsServer(metricsPort);
}
server.default.start(port);
