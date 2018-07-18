"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const errorhandler_1 = __importDefault(require("errorhandler"));
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotEnv = path_1.default.resolve('./.env');
if (fs_1.default.existsSync(dotEnv)) {
    dotenv_1.default.config({ path: dotEnv });
}
if (process.env.NODE_ENV === 'development') {
    app_1.default.use(errorhandler_1.default());
}
const server = app_1.default.listen(process.env.HOST_PORT, () => {
    console.log('**   App is running at %s:%d in %s mode', process.env.HOST_URL, process.env.HOST_PORT, process.env.ENVIRONMENT);
    console.log('** Press CTRL-C to stop\n');
});
exports.default = server;
//# sourceMappingURL=server.js.map