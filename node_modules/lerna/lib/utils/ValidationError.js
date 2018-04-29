"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _npmlog = require("npmlog");

var _npmlog2 = _interopRequireDefault(_npmlog);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ValidationError = function (_Error) {
  _inherits(ValidationError, _Error);

  function ValidationError(prefix, message) {
    _classCallCheck(this, ValidationError);

    var _this = _possibleConstructorReturn(this, (ValidationError.__proto__ || Object.getPrototypeOf(ValidationError)).call(this, message));

    _this.name = "ValidationError";
    _this.prefix = prefix;
    _npmlog2.default.resume(); // might be paused, noop otherwise
    _npmlog2.default.error(prefix, message);
    return _this;
  }

  return ValidationError;
}(Error);

exports.default = ValidationError;
module.exports = exports["default"];