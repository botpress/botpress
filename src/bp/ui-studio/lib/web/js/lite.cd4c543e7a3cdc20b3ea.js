/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/ 		var executeModules = data[2];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
/******/ 				var depId = deferredModule[j];
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
/******/ 			if(fulfilled) {
/******/ 				deferredModules.splice(i--, 1);
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/ 		return result;
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		"lite": 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/js/";
/******/
/******/ 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push(["./src/web/lite.jsx","commons"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/web/lite.jsx":
/*!**************************!*\
  !*** ./src/web/lite.jsx ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if(\"value\"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();__webpack_require__(/*! babel-polyfill */ \"./node_modules/babel-polyfill/lib/index.js\");var _exposeLoaderReactReact=__webpack_require__(/*! expose-loader?React!react */ \"./node_modules/expose-loader/index.js?React!./node_modules/react/index.js-exposed\");var _exposeLoaderReactReact2=_interopRequireDefault(_exposeLoaderReactReact);var _exposeLoaderReactDOMReactDom=__webpack_require__(/*! expose-loader?ReactDOM!react-dom */ \"./node_modules/expose-loader/index.js?ReactDOM!./node_modules/react-dom/index.js-exposed\");var _exposeLoaderReactDOMReactDom2=_interopRequireDefault(_exposeLoaderReactDOMReactDom);var _exposeLoaderPropTypesPropTypes=__webpack_require__(/*! expose-loader?PropTypes!prop-types */ \"./node_modules/expose-loader/index.js?PropTypes!./node_modules/prop-types/index.js-exposed\");var _exposeLoaderPropTypesPropTypes2=_interopRequireDefault(_exposeLoaderPropTypesPropTypes);var _exposeLoaderReactBootstrapReactBootstrap=__webpack_require__(/*! expose-loader?ReactBootstrap!react-bootstrap */ \"./node_modules/expose-loader/index.js?ReactBootstrap!./node_modules/react-bootstrap/es/index.js-exposed\");var _exposeLoaderReactBootstrapReactBootstrap2=_interopRequireDefault(_exposeLoaderReactBootstrapReactBootstrap);var _reactRedux=__webpack_require__(/*! react-redux */ \"./node_modules/react-redux/es/index.js\");var _queryString=__webpack_require__(/*! query-string */ \"./node_modules/query-string/index.js\");var _queryString2=_interopRequireDefault(_queryString);var _axios=__webpack_require__(/*! axios */ \"./node_modules/axios/index.js\");var _axios2=_interopRequireDefault(_axios);var _store=__webpack_require__(/*! ./store */ \"./src/web/store.js\");var _store2=_interopRequireDefault(_store);var _actions=__webpack_require__(/*! ./actions */ \"./src/web/actions/index.js\");var _module=__webpack_require__(/*! ~/components/PluginInjectionSite/module */ \"./src/web/components/PluginInjectionSite/module.jsx\");var _module2=_interopRequireDefault(_module);var _Modules=__webpack_require__(/*! ~/util/Modules */ \"./src/web/util/Modules.js\");var _Auth=__webpack_require__(/*! ~/util/Auth */ \"./src/web/util/Auth.js\");function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError(\"Cannot call a class as a function\");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\");}return call&&(typeof call===\"object\"||typeof call===\"function\")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!==\"function\"&&superClass!==null){throw new TypeError(\"Super expression must either be null or a function, not \"+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}var token=(0,_Auth.getToken)();if(token){_axios2.default.defaults.headers.common['Authorization']='Bearer '+token.token;}var _queryString$parse=_queryString2.default.parse(location.search),m=_queryString$parse.m,v=_queryString$parse.v,ref=_queryString$parse.ref;var alternateModuleNames={'platform-webchat':'channel-web'};var moduleName=alternateModuleNames[m]||m;var LiteView=function(_React$Component){_inherits(LiteView,_React$Component);function LiteView(){_classCallCheck(this,LiteView);return _possibleConstructorReturn(this,(LiteView.__proto__||Object.getPrototypeOf(LiteView)).apply(this,arguments));}_createClass(LiteView,[{key:'componentDidMount',value:function componentDidMount(){this.props.fetchModules();this.sendQueries();}},{key:'sendQueries',value:function sendQueries(){if(!ref){return;}var userId=window.__BP_VISITOR_ID||(0,_Auth.getUniqueVisitorId)();// TODO: why don't we have module-specific code inside of that module?\n_axios2.default.get('/api/botpress-platform-webchat/'+userId+'/reference?ref='+ref);}},{key:'render',value:function render(){var modules=(0,_Modules.moduleViewNames)(this.props.modules.filter(function(module){return module.isPlugin;}));var onNotFound=function onNotFound(){return _exposeLoaderReactReact2.default.createElement('h1',null,'Module $',moduleName,' with view $',v,' not found');};return _exposeLoaderReactReact2.default.createElement('div',null,_exposeLoaderReactReact2.default.createElement(_module2.default,{moduleName:moduleName,viewName:v,lite:true,onNotFound:onNotFound}),modules.map(function(_ref,i){var moduleName=_ref.moduleName,viewName=_ref.viewName;return _exposeLoaderReactReact2.default.createElement(_module2.default,{key:i,moduleName:moduleName,viewName:viewName,onNotFound:onNotFound});}));}}]);return LiteView;}(_exposeLoaderReactReact2.default.Component);var mapDispatchToProps={fetchModules:_actions.fetchModules};var mapStateToProps=function mapStateToProps(state){return{modules:state.modules};};var LiteViewConnected=(0,_reactRedux.connect)(mapStateToProps,mapDispatchToProps)(LiteView);_exposeLoaderReactDOMReactDom2.default.render(_exposeLoaderReactReact2.default.createElement(_reactRedux.Provider,{store:_store2.default},_exposeLoaderReactReact2.default.createElement(LiteViewConnected,null)),document.getElementById('app'));//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvd2ViL2xpdGUuanN4PzgzMWQiXSwibmFtZXMiOlsidG9rZW4iLCJheGlvcyIsImRlZmF1bHRzIiwiaGVhZGVycyIsImNvbW1vbiIsInF1ZXJ5U3RyaW5nIiwicGFyc2UiLCJsb2NhdGlvbiIsInNlYXJjaCIsIm0iLCJ2IiwicmVmIiwiYWx0ZXJuYXRlTW9kdWxlTmFtZXMiLCJtb2R1bGVOYW1lIiwiTGl0ZVZpZXciLCJwcm9wcyIsImZldGNoTW9kdWxlcyIsInNlbmRRdWVyaWVzIiwidXNlcklkIiwid2luZG93IiwiX19CUF9WSVNJVE9SX0lEIiwiZ2V0IiwibW9kdWxlcyIsImZpbHRlciIsIm1vZHVsZSIsImlzUGx1Z2luIiwib25Ob3RGb3VuZCIsIm1hcCIsImkiLCJ2aWV3TmFtZSIsIlJlYWN0IiwiQ29tcG9uZW50IiwibWFwRGlzcGF0Y2hUb1Byb3BzIiwibWFwU3RhdGVUb1Byb3BzIiwic3RhdGUiLCJMaXRlVmlld0Nvbm5lY3RlZCIsIlJlYWN0RE9NIiwicmVuZGVyIiwic3RvcmUiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIl0sIm1hcHBpbmdzIjoiOGZBQUEsd0ZBQ0Esc0ssNkVBQ0EsMEwseUZBQ0EsZ00sNkZBQ0EsaU8saUhBQ0EsaUdBRUEsaUcsdURBQ0EsNkUsMkNBRUEsb0UsMkNBQ0EsZ0ZBQ0Esc0ksNkNBQ0Esb0ZBQ0EsMkUsaTRCQUVBLEdBQU1BLE9BQVEsb0JBQWQsQ0FDQSxHQUFJQSxLQUFKLENBQVcsQ0FDVEMsZ0JBQU1DLFFBQU4sQ0FBZUMsT0FBZixDQUF1QkMsTUFBdkIsQ0FBOEIsZUFBOUIsWUFBMkRKLE1BQU1BLEtBQWpFLENBQ0QsQyx1QkFFcUJLLHNCQUFZQyxLQUFaLENBQWtCQyxTQUFTQyxNQUEzQixDLENBQWRDLEMsb0JBQUFBLEMsQ0FBR0MsQyxvQkFBQUEsQyxDQUFHQyxHLG9CQUFBQSxHLENBRWQsR0FBTUMsc0JBQXVCLENBQzNCLG1CQUFvQixhQURPLENBQTdCLENBR0EsR0FBTUMsWUFBYUQscUJBQXFCSCxDQUFyQixHQUEyQkEsQ0FBOUMsQyxHQUVNSyxTLDJUQUNnQixDQUNsQixLQUFLQyxLQUFMLENBQVdDLFlBQVgsR0FDQSxLQUFLQyxXQUFMLEdBQ0QsQyxpREFFYSxDQUNaLEdBQUksQ0FBQ04sR0FBTCxDQUFVLENBQ1IsT0FDRCxDQUVELEdBQU1PLFFBQVNDLE9BQU9DLGVBQVAsRUFBMEIsOEJBQXpDLENBRUE7QUFDQW5CLGdCQUFNb0IsR0FBTixtQ0FBNENILE1BQTVDLG1CQUFvRVAsR0FBcEUsRUFDRCxDLHVDQUVRLENBQ1AsR0FBTVcsU0FBVSw2QkFBZ0IsS0FBS1AsS0FBTCxDQUFXTyxPQUFYLENBQW1CQyxNQUFuQixDQUEwQix1QkFBVUMsUUFBT0MsUUFBakIsRUFBMUIsQ0FBaEIsQ0FBaEIsQ0FDQSxHQUFNQyxZQUFhLFFBQWJBLFdBQWEsU0FDakIscUVBQ1diLFVBRFgsZ0JBQ21DSCxDQURuQyxjQURpQixFQUFuQixDQU1BLE1BQ0UsMkRBQ0UsK0NBQUMsZ0JBQUQsRUFBb0IsV0FBWUcsVUFBaEMsQ0FBNEMsU0FBVUgsQ0FBdEQsQ0FBeUQsS0FBTSxJQUEvRCxDQUFxRSxXQUFZZ0IsVUFBakYsRUFERixDQUVHSixRQUFRSyxHQUFSLENBQVksY0FBMkJDLENBQTNCLEtBQUdmLFdBQUgsTUFBR0EsVUFBSCxDQUFlZ0IsUUFBZixNQUFlQSxRQUFmLE9BQ1gsZ0RBQUMsZ0JBQUQsRUFBb0IsSUFBS0QsQ0FBekIsQ0FBNEIsV0FBWWYsVUFBeEMsQ0FBb0QsU0FBVWdCLFFBQTlELENBQXdFLFdBQVlILFVBQXBGLEVBRFcsRUFBWixDQUZILENBREYsQ0FRRCxDLHNCQWpDb0JJLGlDQUFNQyxTLEVBb0M3QixHQUFNQyxvQkFBcUIsQ0FBRWhCLGtDQUFGLENBQTNCLENBQ0EsR0FBTWlCLGlCQUFrQixRQUFsQkEsZ0JBQWtCLGNBQVUsQ0FBRVgsUUFBU1ksTUFBTVosT0FBakIsQ0FBVixFQUF4QixDQUNBLEdBQU1hLG1CQUFvQix3QkFBUUYsZUFBUixDQUF5QkQsa0JBQXpCLEVBQTZDbEIsUUFBN0MsQ0FBMUIsQ0FFQXNCLHVDQUFTQyxNQUFULENBQ0UsK0NBQUMsb0JBQUQsRUFBVSxNQUFPQyxlQUFqQixFQUNFLCtDQUFDLGlCQUFELE1BREYsQ0FERixDQUlFQyxTQUFTQyxjQUFULENBQXdCLEtBQXhCLENBSkYiLCJmaWxlIjoiLi9zcmMvd2ViL2xpdGUuanN4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdiYWJlbC1wb2x5ZmlsbCdcbmltcG9ydCBSZWFjdCBmcm9tICdleHBvc2UtbG9hZGVyP1JlYWN0IXJlYWN0J1xuaW1wb3J0IFJlYWN0RE9NIGZyb20gJ2V4cG9zZS1sb2FkZXI/UmVhY3RET00hcmVhY3QtZG9tJ1xuaW1wb3J0IFByb3BUeXBlcyBmcm9tICdleHBvc2UtbG9hZGVyP1Byb3BUeXBlcyFwcm9wLXR5cGVzJ1xuaW1wb3J0IFJlYWN0Qm9vdHN0cmFwIGZyb20gJ2V4cG9zZS1sb2FkZXI/UmVhY3RCb290c3RyYXAhcmVhY3QtYm9vdHN0cmFwJ1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4J1xuaW1wb3J0IHsgUHJvdmlkZXIgfSBmcm9tICdyZWFjdC1yZWR1eCdcbmltcG9ydCBxdWVyeVN0cmluZyBmcm9tICdxdWVyeS1zdHJpbmcnXG5pbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnXG5cbmltcG9ydCBzdG9yZSBmcm9tICcuL3N0b3JlJ1xuaW1wb3J0IHsgZmV0Y2hNb2R1bGVzIH0gZnJvbSAnLi9hY3Rpb25zJ1xuaW1wb3J0IEluamVjdGVkTW9kdWxlVmlldyBmcm9tICd+L2NvbXBvbmVudHMvUGx1Z2luSW5qZWN0aW9uU2l0ZS9tb2R1bGUnXG5pbXBvcnQgeyBtb2R1bGVWaWV3TmFtZXMgfSBmcm9tICd+L3V0aWwvTW9kdWxlcydcbmltcG9ydCB7IGdldFRva2VuLCBnZXRVbmlxdWVWaXNpdG9ySWQgfSBmcm9tICd+L3V0aWwvQXV0aCdcblxuY29uc3QgdG9rZW4gPSBnZXRUb2tlbigpXG5pZiAodG9rZW4pIHtcbiAgYXhpb3MuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ0F1dGhvcml6YXRpb24nXSA9IGBCZWFyZXIgJHt0b2tlbi50b2tlbn1gXG59XG5cbmNvbnN0IHsgbSwgdiwgcmVmIH0gPSBxdWVyeVN0cmluZy5wYXJzZShsb2NhdGlvbi5zZWFyY2gpXG5cbmNvbnN0IGFsdGVybmF0ZU1vZHVsZU5hbWVzID0ge1xuICAncGxhdGZvcm0td2ViY2hhdCc6ICdjaGFubmVsLXdlYidcbn1cbmNvbnN0IG1vZHVsZU5hbWUgPSBhbHRlcm5hdGVNb2R1bGVOYW1lc1ttXSB8fCBtXG5cbmNsYXNzIExpdGVWaWV3IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgdGhpcy5wcm9wcy5mZXRjaE1vZHVsZXMoKVxuICAgIHRoaXMuc2VuZFF1ZXJpZXMoKVxuICB9XG5cbiAgc2VuZFF1ZXJpZXMoKSB7XG4gICAgaWYgKCFyZWYpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHVzZXJJZCA9IHdpbmRvdy5fX0JQX1ZJU0lUT1JfSUQgfHwgZ2V0VW5pcXVlVmlzaXRvcklkKClcblxuICAgIC8vIFRPRE86IHdoeSBkb24ndCB3ZSBoYXZlIG1vZHVsZS1zcGVjaWZpYyBjb2RlIGluc2lkZSBvZiB0aGF0IG1vZHVsZT9cbiAgICBheGlvcy5nZXQoYC9hcGkvYm90cHJlc3MtcGxhdGZvcm0td2ViY2hhdC8ke3VzZXJJZH0vcmVmZXJlbmNlP3JlZj0ke3JlZn1gKVxuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IG1vZHVsZXMgPSBtb2R1bGVWaWV3TmFtZXModGhpcy5wcm9wcy5tb2R1bGVzLmZpbHRlcihtb2R1bGUgPT4gbW9kdWxlLmlzUGx1Z2luKSlcbiAgICBjb25zdCBvbk5vdEZvdW5kID0gKCkgPT4gKFxuICAgICAgPGgxPlxuICAgICAgICBNb2R1bGUgJHttb2R1bGVOYW1lfSB3aXRoIHZpZXcgJHt2fSBub3QgZm91bmRcbiAgICAgIDwvaDE+XG4gICAgKVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxJbmplY3RlZE1vZHVsZVZpZXcgbW9kdWxlTmFtZT17bW9kdWxlTmFtZX0gdmlld05hbWU9e3Z9IGxpdGU9e3RydWV9IG9uTm90Rm91bmQ9e29uTm90Rm91bmR9IC8+XG4gICAgICAgIHttb2R1bGVzLm1hcCgoeyBtb2R1bGVOYW1lLCB2aWV3TmFtZSB9LCBpKSA9PiAoXG4gICAgICAgICAgPEluamVjdGVkTW9kdWxlVmlldyBrZXk9e2l9IG1vZHVsZU5hbWU9e21vZHVsZU5hbWV9IHZpZXdOYW1lPXt2aWV3TmFtZX0gb25Ob3RGb3VuZD17b25Ob3RGb3VuZH0gLz5cbiAgICAgICAgKSl9XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuY29uc3QgbWFwRGlzcGF0Y2hUb1Byb3BzID0geyBmZXRjaE1vZHVsZXMgfVxuY29uc3QgbWFwU3RhdGVUb1Byb3BzID0gc3RhdGUgPT4gKHsgbW9kdWxlczogc3RhdGUubW9kdWxlcyB9KVxuY29uc3QgTGl0ZVZpZXdDb25uZWN0ZWQgPSBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcywgbWFwRGlzcGF0Y2hUb1Byb3BzKShMaXRlVmlldylcblxuUmVhY3RET00ucmVuZGVyKFxuICA8UHJvdmlkZXIgc3RvcmU9e3N0b3JlfT5cbiAgICA8TGl0ZVZpZXdDb25uZWN0ZWQgLz5cbiAgPC9Qcm92aWRlcj4sXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcHAnKVxuKVxuIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./src/web/lite.jsx\n");

/***/ })

/******/ });