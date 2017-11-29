---
layout: guide
---

## Built-in HTTP Server <a class="toc" id="toc-built-in-http-server" href="#toc-built-in-http-server"></a>

Botpress uses and exposes an instance of [`express`](http://expressjs.com/). The web interface is served by Express as well as the built-in botpress API.

You may define your own APIs with the help of Routers (`express.Router`). From the official express [documentation](http://expressjs.com/en/guide/routing.html):

> Use the express.Router class to create modular, mountable route handlers. A Router instance is a complete middleware and routing system; for this reason, it is often referred to as a “mini-app”.

To get a Router, simply call the `getRouter(moduleName)`method. The name of the module is required as API routes are scoped by modules.

### API Example <a class="toc" id="toc-api-example" href="#toc-api-example"></a>

```js
var router = bp.getRouter('botpress-analytics');

// Will be exposed at: http://localhost:3000/api/botpress-analytics/ping
router.get('/ping', (req, res, next) => res.send('pong'))
```

### Authentication <a class="toc" id="toc-authentication" href="#toc-authentication"></a>

By default, routes will be secured the same way the regular botpress API routes are secured. In some instances, you might want to disable the build-in botpress authentication, which you need to specify when you get the router:

```js
bp.getRouter('botpress-messenger', { auth: false })
```

You can also conditionally disable authentication:

```js
bp.getRouter('botpress-messenger', {
    auth: (req) => req.method.toLowerCase() === 'post'
}
```
