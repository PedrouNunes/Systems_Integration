"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@node-wot/core");
const file_client_1 = __importDefault(require("./file-client"));
const { debug } = (0, core_1.createLoggers)("binding-file", "file-client-factory");
class FileClientFactory {
    constructor() {
        this.scheme = "file";
        this.init = () => true;
        this.destroy = () => true;
    }
    getClient() {
        debug(`FileClientFactory creating client for '${this.scheme}'`);
        return new file_client_1.default();
    }
}
exports.default = FileClientFactory;
//# sourceMappingURL=file-client-factory.js.map