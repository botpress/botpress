"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UpdateTask = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class UpdateTask {
  constructor(_bp, _interval) {
    this._bp = _bp;
    this._interval = _interval;

    _defineProperty(this, "runTask", void 0);

    _defineProperty(this, "_currentPromise", void 0);

    _defineProperty(this, "_intervalRef", void 0);
  }

  async start(botId) {
    if (this._intervalRef) {
      throw new Error('The update is already running.');
    }

    this._intervalRef = setInterval(this._runTaskWhenReady.bind(this), this._interval);
  }

  stop(botId) {
    clearInterval(this._intervalRef);
    this._intervalRef = undefined;
  }

  async _runTaskWhenReady() {
    if (this._currentPromise) {
      return;
    }

    this._currentPromise = this.runTask && this.runTask().catch(err => this._bp.logger.warn('Error running update: ' + err.message)).finally(() => {
      this._currentPromise = undefined;
    });
  }

}

exports.UpdateTask = UpdateTask;
//# sourceMappingURL=task.js.map