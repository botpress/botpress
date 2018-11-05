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
/******/ 	__webpack_require__.p = "$$BP_BASE_URL$$/js/";
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
eval("var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if(\"value\"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();__webpack_require__(/*! babel-polyfill */ \"./node_modules/babel-polyfill/lib/index.js\");var _exposeLoaderReactReact=__webpack_require__(/*! expose-loader?React!react */ \"./node_modules/expose-loader/index.js?React!./node_modules/react/index.js-exposed\");var _exposeLoaderReactReact2=_interopRequireDefault(_exposeLoaderReactReact);var _exposeLoaderReactDOMReactDom=__webpack_require__(/*! expose-loader?ReactDOM!react-dom */ \"./node_modules/expose-loader/index.js?ReactDOM!./node_modules/react-dom/index.js-exposed\");var _exposeLoaderReactDOMReactDom2=_interopRequireDefault(_exposeLoaderReactDOMReactDom);var _reactRedux=__webpack_require__(/*! react-redux */ \"./node_modules/react-redux/es/index.js\");var _queryString=__webpack_require__(/*! query-string */ \"./node_modules/query-string/index.js\");var _queryString2=_interopRequireDefault(_queryString);var _axios=__webpack_require__(/*! axios */ \"./node_modules/axios/index.js\");var _axios2=_interopRequireDefault(_axios);var _util=__webpack_require__(/*! ./util */ \"./src/web/util.js\");var _store=__webpack_require__(/*! ./store */ \"./src/web/store.js\");var _store2=_interopRequireDefault(_store);var _actions=__webpack_require__(/*! ./actions */ \"./src/web/actions/index.js\");var _module=__webpack_require__(/*! ~/components/PluginInjectionSite/module */ \"./src/web/components/PluginInjectionSite/module.jsx\");var _module2=_interopRequireDefault(_module);var _Modules=__webpack_require__(/*! ~/util/Modules */ \"./src/web/util/Modules.js\");var _Auth=__webpack_require__(/*! ~/util/Auth */ \"./src/web/util/Auth.js\");function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError(\"Cannot call a class as a function\");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\");}return call&&(typeof call===\"object\"||typeof call===\"function\")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!==\"function\"&&superClass!==null){throw new TypeError(\"Super expression must either be null or a function, not \"+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}var token=(0,_Auth.getToken)();if(token){_axios2.default.defaults.headers.common['Authorization']='Bearer '+token.token;}if(_axios2.default&&_axios2.default.defaults){_axios2.default.defaults.headers.common['X-Botpress-App']='Lite';_axios2.default.defaults.headers.common['X-Botpress-Bot-Id']=(0,_util.parseBotId)();}var _queryString$parse=_queryString2.default.parse(location.search),m=_queryString$parse.m,v=_queryString$parse.v,ref=_queryString$parse.ref;var alternateModuleNames={'platform-webchat':'channel-web'};var moduleName=alternateModuleNames[m]||m;var LiteView=function(_React$Component){_inherits(LiteView,_React$Component);function LiteView(){_classCallCheck(this,LiteView);return _possibleConstructorReturn(this,(LiteView.__proto__||Object.getPrototypeOf(LiteView)).apply(this,arguments));}_createClass(LiteView,[{key:'componentDidMount',value:function componentDidMount(){this.props.fetchModules();this.sendQueries();}},{key:'sendQueries',value:function sendQueries(){if(!ref){return;}var userId=window.__BP_VISITOR_ID||(0,_Auth.getUniqueVisitorId)();// TODO: why don't we have module-specific code inside of that module?\n_axios2.default.get('/api/botpress-platform-webchat/'+userId+'/reference?ref='+ref);}},{key:'render',value:function render(){var modules=(0,_Modules.moduleViewNames)(this.props.modules.filter(function(module){return module.isPlugin;}));var onNotFound=function onNotFound(){return _exposeLoaderReactReact2.default.createElement('h1',null,'Module $',moduleName,' with view $',v,' not found');};return _exposeLoaderReactReact2.default.createElement('div',null,_exposeLoaderReactReact2.default.createElement(_module2.default,{moduleName:moduleName,viewName:v,lite:true,onNotFound:onNotFound}),modules.map(function(_ref,i){var moduleName=_ref.moduleName,viewName=_ref.viewName;return _exposeLoaderReactReact2.default.createElement(_module2.default,{key:i,moduleName:moduleName,viewName:viewName,onNotFound:onNotFound});}));}}]);return LiteView;}(_exposeLoaderReactReact2.default.Component);var mapDispatchToProps={fetchModules:_actions.fetchModules};var mapStateToProps=function mapStateToProps(state){return{modules:state.modules};};var LiteViewConnected=(0,_reactRedux.connect)(mapStateToProps,mapDispatchToProps)(LiteView);_exposeLoaderReactDOMReactDom2.default.render(_exposeLoaderReactReact2.default.createElement(_reactRedux.Provider,{store:_store2.default},_exposeLoaderReactReact2.default.createElement(LiteViewConnected,null)),document.getElementById('app'));//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvd2ViL2xpdGUuanN4PzgzMWQiXSwibmFtZXMiOlsidG9rZW4iLCJheGlvcyIsImRlZmF1bHRzIiwiaGVhZGVycyIsImNvbW1vbiIsInF1ZXJ5U3RyaW5nIiwicGFyc2UiLCJsb2NhdGlvbiIsInNlYXJjaCIsIm0iLCJ2IiwicmVmIiwiYWx0ZXJuYXRlTW9kdWxlTmFtZXMiLCJtb2R1bGVOYW1lIiwiTGl0ZVZpZXciLCJwcm9wcyIsImZldGNoTW9kdWxlcyIsInNlbmRRdWVyaWVzIiwidXNlcklkIiwid2luZG93IiwiX19CUF9WSVNJVE9SX0lEIiwiZ2V0IiwibW9kdWxlcyIsImZpbHRlciIsIm1vZHVsZSIsImlzUGx1Z2luIiwib25Ob3RGb3VuZCIsIm1hcCIsImkiLCJ2aWV3TmFtZSIsIlJlYWN0IiwiQ29tcG9uZW50IiwibWFwRGlzcGF0Y2hUb1Byb3BzIiwibWFwU3RhdGVUb1Byb3BzIiwic3RhdGUiLCJMaXRlVmlld0Nvbm5lY3RlZCIsIlJlYWN0RE9NIiwicmVuZGVyIiwic3RvcmUiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIl0sIm1hcHBpbmdzIjoiOGZBQUEsd0ZBQ0Esc0ssNkVBQ0EsMEwseUZBQ0EsaUdBRUEsaUcsdURBQ0EsNkUsMkNBQ0EsaUVBRUEsb0UsMkNBQ0EsZ0ZBQ0Esc0ksNkNBQ0Esb0ZBQ0EsMkUsaTRCQUVBLEdBQU1BLE9BQVEsb0JBQWQsQ0FDQSxHQUFJQSxLQUFKLENBQVcsQ0FDVEMsZ0JBQU1DLFFBQU4sQ0FBZUMsT0FBZixDQUF1QkMsTUFBdkIsQ0FBOEIsZUFBOUIsWUFBMkRKLE1BQU1BLEtBQWpFLENBQ0QsQ0FFRCxHQUFJQyxpQkFBU0EsZ0JBQU1DLFFBQW5CLENBQTZCLENBQzNCRCxnQkFBTUMsUUFBTixDQUFlQyxPQUFmLENBQXVCQyxNQUF2QixDQUE4QixnQkFBOUIsRUFBa0QsTUFBbEQsQ0FDQUgsZ0JBQU1DLFFBQU4sQ0FBZUMsT0FBZixDQUF1QkMsTUFBdkIsQ0FBOEIsbUJBQTlCLEVBQXFELHNCQUFyRCxDQUNELEMsdUJBRXFCQyxzQkFBWUMsS0FBWixDQUFrQkMsU0FBU0MsTUFBM0IsQyxDQUFkQyxDLG9CQUFBQSxDLENBQUdDLEMsb0JBQUFBLEMsQ0FBR0MsRyxvQkFBQUEsRyxDQUVkLEdBQU1DLHNCQUF1QixDQUMzQixtQkFBb0IsYUFETyxDQUE3QixDQUdBLEdBQU1DLFlBQWFELHFCQUFxQkgsQ0FBckIsR0FBMkJBLENBQTlDLEMsR0FFTUssUywyVEFDZ0IsQ0FDbEIsS0FBS0MsS0FBTCxDQUFXQyxZQUFYLEdBQ0EsS0FBS0MsV0FBTCxHQUNELEMsaURBRWEsQ0FDWixHQUFJLENBQUNOLEdBQUwsQ0FBVSxDQUNSLE9BQ0QsQ0FFRCxHQUFNTyxRQUFTQyxPQUFPQyxlQUFQLEVBQTBCLDhCQUF6QyxDQUVBO0FBQ0FuQixnQkFBTW9CLEdBQU4sbUNBQTRDSCxNQUE1QyxtQkFBb0VQLEdBQXBFLEVBQ0QsQyx1Q0FFUSxDQUNQLEdBQU1XLFNBQVUsNkJBQWdCLEtBQUtQLEtBQUwsQ0FBV08sT0FBWCxDQUFtQkMsTUFBbkIsQ0FBMEIsdUJBQVVDLFFBQU9DLFFBQWpCLEVBQTFCLENBQWhCLENBQWhCLENBQ0EsR0FBTUMsWUFBYSxRQUFiQSxXQUFhLFNBQ2pCLHFFQUNXYixVQURYLGdCQUNtQ0gsQ0FEbkMsY0FEaUIsRUFBbkIsQ0FNQSxNQUNFLDJEQUNFLCtDQUFDLGdCQUFELEVBQW9CLFdBQVlHLFVBQWhDLENBQTRDLFNBQVVILENBQXRELENBQXlELEtBQU0sSUFBL0QsQ0FBcUUsV0FBWWdCLFVBQWpGLEVBREYsQ0FFR0osUUFBUUssR0FBUixDQUFZLGNBQTJCQyxDQUEzQixLQUFHZixXQUFILE1BQUdBLFVBQUgsQ0FBZWdCLFFBQWYsTUFBZUEsUUFBZixPQUNYLGdEQUFDLGdCQUFELEVBQW9CLElBQUtELENBQXpCLENBQTRCLFdBQVlmLFVBQXhDLENBQW9ELFNBQVVnQixRQUE5RCxDQUF3RSxXQUFZSCxVQUFwRixFQURXLEVBQVosQ0FGSCxDQURGLENBUUQsQyxzQkFqQ29CSSxpQ0FBTUMsUyxFQW9DN0IsR0FBTUMsb0JBQXFCLENBQUVoQixrQ0FBRixDQUEzQixDQUNBLEdBQU1pQixpQkFBa0IsUUFBbEJBLGdCQUFrQixjQUFVLENBQUVYLFFBQVNZLE1BQU1aLE9BQWpCLENBQVYsRUFBeEIsQ0FDQSxHQUFNYSxtQkFBb0Isd0JBQ3hCRixlQUR3QixDQUV4QkQsa0JBRndCLEVBR3hCbEIsUUFId0IsQ0FBMUIsQ0FLQXNCLHVDQUFTQyxNQUFULENBQ0UsK0NBQUMsb0JBQUQsRUFBVSxNQUFPQyxlQUFqQixFQUNFLCtDQUFDLGlCQUFELE1BREYsQ0FERixDQUlFQyxTQUFTQyxjQUFULENBQXdCLEtBQXhCLENBSkYiLCJmaWxlIjoiLi9zcmMvd2ViL2xpdGUuanN4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdiYWJlbC1wb2x5ZmlsbCdcbmltcG9ydCBSZWFjdCBmcm9tICdleHBvc2UtbG9hZGVyP1JlYWN0IXJlYWN0J1xuaW1wb3J0IFJlYWN0RE9NIGZyb20gJ2V4cG9zZS1sb2FkZXI/UmVhY3RET00hcmVhY3QtZG9tJ1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4J1xuaW1wb3J0IHsgUHJvdmlkZXIgfSBmcm9tICdyZWFjdC1yZWR1eCdcbmltcG9ydCBxdWVyeVN0cmluZyBmcm9tICdxdWVyeS1zdHJpbmcnXG5pbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnXG5pbXBvcnQgeyBwYXJzZUJvdElkIH0gZnJvbSAnLi91dGlsJ1xuXG5pbXBvcnQgc3RvcmUgZnJvbSAnLi9zdG9yZSdcbmltcG9ydCB7IGZldGNoTW9kdWxlcyB9IGZyb20gJy4vYWN0aW9ucydcbmltcG9ydCBJbmplY3RlZE1vZHVsZVZpZXcgZnJvbSAnfi9jb21wb25lbnRzL1BsdWdpbkluamVjdGlvblNpdGUvbW9kdWxlJ1xuaW1wb3J0IHsgbW9kdWxlVmlld05hbWVzIH0gZnJvbSAnfi91dGlsL01vZHVsZXMnXG5pbXBvcnQgeyBnZXRUb2tlbiwgZ2V0VW5pcXVlVmlzaXRvcklkIH0gZnJvbSAnfi91dGlsL0F1dGgnXG5cbmNvbnN0IHRva2VuID0gZ2V0VG9rZW4oKVxuaWYgKHRva2VuKSB7XG4gIGF4aW9zLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydBdXRob3JpemF0aW9uJ10gPSBgQmVhcmVyICR7dG9rZW4udG9rZW59YFxufVxuXG5pZiAoYXhpb3MgJiYgYXhpb3MuZGVmYXVsdHMpIHtcbiAgYXhpb3MuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ1gtQm90cHJlc3MtQXBwJ10gPSAnTGl0ZSdcbiAgYXhpb3MuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ1gtQm90cHJlc3MtQm90LUlkJ10gPSBwYXJzZUJvdElkKClcbn1cblxuY29uc3QgeyBtLCB2LCByZWYgfSA9IHF1ZXJ5U3RyaW5nLnBhcnNlKGxvY2F0aW9uLnNlYXJjaClcblxuY29uc3QgYWx0ZXJuYXRlTW9kdWxlTmFtZXMgPSB7XG4gICdwbGF0Zm9ybS13ZWJjaGF0JzogJ2NoYW5uZWwtd2ViJ1xufVxuY29uc3QgbW9kdWxlTmFtZSA9IGFsdGVybmF0ZU1vZHVsZU5hbWVzW21dIHx8IG1cblxuY2xhc3MgTGl0ZVZpZXcgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICB0aGlzLnByb3BzLmZldGNoTW9kdWxlcygpXG4gICAgdGhpcy5zZW5kUXVlcmllcygpXG4gIH1cblxuICBzZW5kUXVlcmllcygpIHtcbiAgICBpZiAoIXJlZikge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgdXNlcklkID0gd2luZG93Ll9fQlBfVklTSVRPUl9JRCB8fCBnZXRVbmlxdWVWaXNpdG9ySWQoKVxuXG4gICAgLy8gVE9ETzogd2h5IGRvbid0IHdlIGhhdmUgbW9kdWxlLXNwZWNpZmljIGNvZGUgaW5zaWRlIG9mIHRoYXQgbW9kdWxlP1xuICAgIGF4aW9zLmdldChgL2FwaS9ib3RwcmVzcy1wbGF0Zm9ybS13ZWJjaGF0LyR7dXNlcklkfS9yZWZlcmVuY2U/cmVmPSR7cmVmfWApXG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgbW9kdWxlcyA9IG1vZHVsZVZpZXdOYW1lcyh0aGlzLnByb3BzLm1vZHVsZXMuZmlsdGVyKG1vZHVsZSA9PiBtb2R1bGUuaXNQbHVnaW4pKVxuICAgIGNvbnN0IG9uTm90Rm91bmQgPSAoKSA9PiAoXG4gICAgICA8aDE+XG4gICAgICAgIE1vZHVsZSAke21vZHVsZU5hbWV9IHdpdGggdmlldyAke3Z9IG5vdCBmb3VuZFxuICAgICAgPC9oMT5cbiAgICApXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPEluamVjdGVkTW9kdWxlVmlldyBtb2R1bGVOYW1lPXttb2R1bGVOYW1lfSB2aWV3TmFtZT17dn0gbGl0ZT17dHJ1ZX0gb25Ob3RGb3VuZD17b25Ob3RGb3VuZH0gLz5cbiAgICAgICAge21vZHVsZXMubWFwKCh7IG1vZHVsZU5hbWUsIHZpZXdOYW1lIH0sIGkpID0+IChcbiAgICAgICAgICA8SW5qZWN0ZWRNb2R1bGVWaWV3IGtleT17aX0gbW9kdWxlTmFtZT17bW9kdWxlTmFtZX0gdmlld05hbWU9e3ZpZXdOYW1lfSBvbk5vdEZvdW5kPXtvbk5vdEZvdW5kfSAvPlxuICAgICAgICApKX1cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5jb25zdCBtYXBEaXNwYXRjaFRvUHJvcHMgPSB7IGZldGNoTW9kdWxlcyB9XG5jb25zdCBtYXBTdGF0ZVRvUHJvcHMgPSBzdGF0ZSA9PiAoeyBtb2R1bGVzOiBzdGF0ZS5tb2R1bGVzIH0pXG5jb25zdCBMaXRlVmlld0Nvbm5lY3RlZCA9IGNvbm5lY3QoXG4gIG1hcFN0YXRlVG9Qcm9wcyxcbiAgbWFwRGlzcGF0Y2hUb1Byb3BzXG4pKExpdGVWaWV3KVxuXG5SZWFjdERPTS5yZW5kZXIoXG4gIDxQcm92aWRlciBzdG9yZT17c3RvcmV9PlxuICAgIDxMaXRlVmlld0Nvbm5lY3RlZCAvPlxuICA8L1Byb3ZpZGVyPixcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcCcpXG4pXG4iXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/web/lite.jsx\n");

/***/ })

/******/ });