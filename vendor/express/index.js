const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

function compilePath(routePath) {
  const keys = [];
  const pattern = routePath
    .replace(/\//g, '\\/')
    .replace(/:([^/]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
  return { regex: new RegExp(`^${pattern}$`), keys };
}

function createApp() {
  const stack = [];
  const settings = {};
  const engines = {};

  function addRoute(method, routePath, handlers) {
    const { regex, keys } = compilePath(routePath);
    stack.push({ type: 'route', method, routePath, regex, keys, handlers });
  }

  const app = {
    __isRouter: true,
    stack,
    settings,
    engines,
    use(...args) {
      let routePath = '/';
      let handlers = args;
      if (typeof args[0] === 'string') {
        routePath = args[0];
        handlers = args.slice(1);
      }

      handlers.forEach((handler) => {
        if (handler && handler.__isRouter) {
          handler.stack.forEach((item) => {
            if (item.type === 'route') {
              addRoute(item.method, normalizePath(routePath, item.routePath), item.handlers);
            } else {
              stack.push({ ...item, path: normalizePath(routePath, item.path) });
            }
          });
          return;
        }
        stack.push({ type: 'middleware', path: routePath, handler });
      });
    },
    get(routePath, ...handlers) {
      addRoute('GET', routePath, handlers);
    },
    post(routePath, ...handlers) {
      addRoute('POST', routePath, handlers);
    },
    set(key, value) {
      settings[key] = value;
    },
    listen(port, callback) {
      const server = http.createServer((req, res) => handleRequest(app, req, res));
      return server.listen(port, callback);
    }
  };

  return app;
}

function normalizePath(base, part) {
  const joined = `${base}/${part}`.replace(/\/+/g, '/');
  return joined.length > 1 && joined.endsWith('/') ? joined.slice(0, -1) : joined;
}

function handleRequest(app, req, res) {
  const parsedUrl = url.parse(req.url, true);
  req.path = parsedUrl.pathname;
  req.query = parsedUrl.query;
  req.params = {};
  req.body = {};
  res.locals = {};

  res.status = function status(code) {
    res.statusCode = code;
    return res;
  };
  res.redirect = function redirect(location) {
    res.statusCode = 302;
    res.setHeader('Location', location);
    res.end();
  };
  res.render = function render(view, data = {}) {
    const ext = app.settings['view engine'] || 'ejs';
    const viewsDir = app.settings.views || path.join(process.cwd(), 'views');
    const filename = path.join(viewsDir, `${view}.${ext}`);
    const engine = require(ext).__express;
    engine(filename, { ...res.locals, ...data }, (err, html) => {
      if (err) {
        res.statusCode = 500;
        res.end(err.message);
        return;
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(html);
    });
  };

  const matches = app.stack.filter((item) => {
    if (item.type === 'middleware') {
      return req.path === item.path || req.path.startsWith(item.path === '/' ? '/' : `${item.path}/`) || req.path === item.path;
    }
    if (item.method !== req.method) {
      return false;
    }
    const matched = req.path.match(item.regex);
    if (!matched) {
      return false;
    }
    item.keys.forEach((key, index) => {
      req.params[key] = matched[index + 1];
    });
    return true;
  });

  let index = 0;
  function next(err) {
    const layer = matches[index++];
    if (!layer) {
      if (err) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      } else if (!res.writableEnded) {
        res.statusCode = 404;
        res.end('Not Found');
      }
      return;
    }

    if (layer.type === 'middleware') {
      if (err) {
        if (layer.handler.length === 4) {
          return layer.handler(err, req, res, next);
        }
        return next(err);
      }
      if (layer.handler.length === 4) {
        return next();
      }
      return layer.handler(req, res, next);
    }

    let routeIndex = 0;
    function runRoute(routeErr) {
      const handler = layer.handlers[routeIndex++];
      if (!handler) {
        return next(routeErr);
      }
      if (routeErr) {
        if (handler.length === 4) {
          return handler(routeErr, req, res, runRoute);
        }
        return runRoute(routeErr);
      }
      if (handler.length === 4) {
        return runRoute();
      }
      return handler(req, res, runRoute);
    }
    return runRoute(err);
  }

  next();
}

function Router() {
  return createApp();
}

function urlencoded() {
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return next();
    }
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      req.body = querystring.parse(body);
      next();
    });
  };
}

function staticMiddleware(rootDir) {
  const absoluteRoot = path.resolve(rootDir);
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    const filePath = path.join(absoluteRoot, req.path.replace(/^\//, ''));
    if (!filePath.startsWith(absoluteRoot) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      return next();
    }
    const ext = path.extname(filePath);
    if (ext === '.css') {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
    fs.createReadStream(filePath).pipe(res);
  };
}

function express() {
  return createApp();
}

express.Router = Router;
express.urlencoded = urlencoded;
express.static = staticMiddleware;

module.exports = express;
