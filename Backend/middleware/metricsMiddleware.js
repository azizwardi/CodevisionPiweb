const promClient = require('prom-client');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add a default label to all metrics
register.setDefaultLabels({
  app: 'piwebapp-backend'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] // buckets for response time from 0.1s to 10s
});

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const databaseOperationDuration = new promClient.Histogram({
  name: 'database_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const activeConnections = new promClient.Gauge({
  name: 'socket_connections_active',
  help: 'Number of active socket connections'
});

const errorCounter = new promClient.Counter({
  name: 'app_errors_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'location']
});

// Register the custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);
register.registerMetric(databaseOperationDuration);
register.registerMetric(activeConnections);
register.registerMetric(errorCounter);

// Middleware to track HTTP request duration and count
const metricsMiddleware = (req, res, next) => {
  // Record start time
  const start = Date.now();
  
  // Add a listener for the response finish event
  res.once('finish', () => {
    // Calculate duration in seconds
    const duration = (Date.now() - start) / 1000;
    
    // Get the route (or use the path if route is not available)
    const route = req.route ? req.route.path : req.path;
    
    // Increment the request counter
    httpRequestCounter.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode
    });
    
    // Record the request duration
    httpRequestDurationMicroseconds.observe(
      {
        method: req.method,
        route: route,
        status_code: res.statusCode
      },
      duration
    );
  });
  
  next();
};

// Export the metrics middleware and registry
module.exports = {
  metricsMiddleware,
  register,
  metrics: {
    httpRequestDurationMicroseconds,
    httpRequestCounter,
    databaseOperationDuration,
    activeConnections,
    errorCounter
  }
};
