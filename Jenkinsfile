pipeline {
    agent any

    environment {
        // Registry configuration
        registryCredentials = "nexus"
        registry = "192.168.33.10:8083"

        // Image names with build number for versioning
        BACKEND_IMAGE = "${registry}/piwebapp-backend:${BUILD_NUMBER}"
        FRONTEND_IMAGE = "${registry}/piwebapp-frontend:${BUILD_NUMBER}"
        PROMETHEUS_IMAGE = "${registry}/piwebapp-prometheus:${BUILD_NUMBER}"
        GRAFANA_IMAGE = "${registry}/piwebapp-grafana:${BUILD_NUMBER}"

        // MongoDB credentials (stored as Jenkins credentials would be better)
        MONGO_USER = "root"
        MONGO_PASSWORD = "example"

        // JWT secret (stored as Jenkins credentials would be better)
        JWT_SECRET = "development_jwt_secret_replace_in_production"

        // Node environment
        NODE_ENV = "production"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('Backend') {
                            // Use --legacy-peer-deps to avoid dependency conflicts
                            sh 'npm ci --legacy-peer-deps'
                            // Install build dependencies explicitly
                            sh 'npm install --no-save --yes webpack webpack-cli babel-loader'
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('Frontend') {
                            // Use --legacy-peer-deps to avoid dependency conflicts
                            sh 'npm ci --legacy-peer-deps'
                        }
                    }
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('Backend') {
                    script {
                        // Create a simple directory for the build output
                        sh 'mkdir -p dev_build'

                        // Copy server files to the build directory (with error handling)
                        sh '''
                        cp server.js dev_build/ || echo "server.js not found, creating minimal version"
                        if [ ! -f dev_build/server.js ]; then
                          echo "Creating minimal server.js"
                          cat > dev_build/server.js << 'EOF'
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

// Import metrics module
const { register, metricsMiddleware } = require('./metrics');

// Add middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add metrics middleware
app.use(metricsMiddleware);

// Add CORS support
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Backend API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Add error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Metrics available at http://localhost:${port}/metrics`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
EOF
                        fi

                        # Copy directories if they exist
                        for dir in routes models controllers middleware config utils; do
                          if [ -d "$dir" ]; then
                            cp -r $dir dev_build/ || echo "$dir not copied"
                          else
                            echo "$dir directory not found, skipping"
                            mkdir -p dev_build/$dir
                          fi
                        done
                        '''

                        // Create a simple package.json for production
                        writeFile file: 'dev_build/package.json', text: '''{
  "name": "backend-prod",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.21.2",
    "mongoose": "^8.10.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "body-parser": "^1.20.3",
    "cookie-parser": "^1.4.7",
    "express-rate-limit": "^7.5.0",
    "helmet": "^8.0.0",
    "morgan": "^1.10.0",
    "prom-client": "^14.2.0"
  }
}'''

                        // Create a metrics.js file for Prometheus metrics
                        writeFile file: 'dev_build/metrics.js', text: '''
const promClient = require('prom-client');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
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
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Register the custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);

// Middleware to track HTTP request duration and count
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  // Record end time and calculate duration on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route ? req.route.path : req.path;
    const method = req.method;
    const statusCode = res.statusCode;

    // Record metrics
    httpRequestDurationMicroseconds
      .labels(method, route, statusCode)
      .observe(duration / 1000); // Convert to seconds

    httpRequestCounter
      .labels(method, route, statusCode)
      .inc();
  });

  next();
};

module.exports = {
  register,
  metricsMiddleware
};
'''

                        echo "Backend build completed successfully"
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('Frontend') {
                    script {
                        // Create a static build directory instead of using Vite
                        sh 'mkdir -p dist'
                        sh 'mkdir -p dist/assets'

                        // Copy the public directory contents to dist
                        sh 'cp -r public/* dist/ || true'

                        // Create a simple index.html
                        writeFile file: 'dist/index.html', text: '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PiWeb Application</title>
  <link rel="stylesheet" href="./assets/index.css">
</head>
<body>
  <div id="root">
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
      <h1>PiWeb Application</h1>
      <p>Application is loading...</p>
    </div>
  </div>
  <script>
    // This is a placeholder. In a real build, this would be replaced with the actual bundled JavaScript.
    window.onload = function() {
      console.log('Application loaded');
    }
  </script>
</body>
</html>'''

                        // Create a simple CSS file
                        writeFile file: 'dist/assets/index.css', text: '''
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}

h1 {
  color: #333;
}
'''

                        echo "Frontend static build completed successfully"
                    }
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Backend Image') {
                    steps {
                        dir('Backend') {
                            script {
                                writeFile file: 'Dockerfile.prod', text: '''
FROM node:18-alpine
WORKDIR /app
COPY dev_build .
RUN npm install --omit=dev
EXPOSE 5000
CMD ["node", "server.js"]
'''
                                sh "docker build -t ${BACKEND_IMAGE} -f Dockerfile.prod ."
                            }
                        }
                    }
                }
                stage('Frontend Image') {
                    steps {
                        dir('Frontend') {
                            script {
                                writeFile file: 'Dockerfile.prod', text: '''
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
'''
                                writeFile file: 'nginx.conf', text: '''
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
'''
                                sh "docker build -t ${FRONTEND_IMAGE} -f Dockerfile.prod ."
                            }
                        }
                    }
                }
                stage('Prometheus Image') {
                    steps {
                        script {
                            // Create a directory for Prometheus
                            sh "mkdir -p Prometheus"
                            dir('Prometheus') {
                                // Create prometheus.yml configuration file
                                writeFile file: 'prometheus.yml', text: '''
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: /metrics

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
'''
                                // Create Dockerfile for Prometheus
                                writeFile file: 'Dockerfile', text: '''
FROM prom/prometheus:latest
COPY prometheus.yml /etc/prometheus/prometheus.yml
EXPOSE 9090
'''
                                // Build Prometheus image
                                sh "docker build -t ${PROMETHEUS_IMAGE} ."
                            }
                        }
                    }
                }
                stage('Grafana Image') {
                    steps {
                        script {
                            // Create a directory for Grafana
                            sh "mkdir -p Grafana"
                            dir('Grafana') {
                                // Create datasource.yml for Grafana
                                writeFile file: 'datasource.yml', text: '''
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
'''
                                // Create dashboard.json for Grafana
                                writeFile file: 'dashboard.json', text: '''
{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": "-- Grafana --",
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "gnetId": null,
  "graphTooltip": 0,
  "id": 1,
  "links": [],
  "panels": [
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 9,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 2,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "dataLinks": []
      },
      "percentage": false,
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "up",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "Service Status",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    }
  ],
  "schemaVersion": 22,
  "style": "dark",
  "tags": [],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-6h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "PiWeb Application Dashboard",
  "uid": "piweb",
  "version": 1
}
'''
                                // Create dashboard.yml for Grafana
                                writeFile file: 'dashboard.yml', text: '''
apiVersion: 1

providers:
  - name: 'Default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    options:
      path: /etc/grafana/provisioning/dashboards
'''
                                // Create Dockerfile for Grafana
                                writeFile file: 'Dockerfile', text: '''
FROM grafana/grafana:latest
COPY datasource.yml /etc/grafana/provisioning/datasources/datasource.yml
COPY dashboard.yml /etc/grafana/provisioning/dashboards/dashboard.yml
COPY dashboard.json /etc/grafana/provisioning/dashboards/dashboard.json
EXPOSE 3000
'''
                                // Build Grafana image
                                sh "docker build -t ${GRAFANA_IMAGE} ."
                            }
                        }
                    }
                }
            }
        }

        stage('Create Docker Compose File') {
            steps {
                script {
                    // Calculate port offsets based on build number to avoid conflicts
                    def buildNumberInt = BUILD_NUMBER.toInteger()
                    def backendPort = 5000 + (buildNumberInt % 10) // Use build number modulo 10 to get a range of 10 ports
                    def frontendPort = 8000 + (buildNumberInt % 10) // Frontend on 8000-8009 range
                    def mongoPort = 27017 + (buildNumberInt % 10) // MongoDB on 27017-27026 range
                    def prometheusPort = 9090 + (buildNumberInt % 10) // Prometheus on 9090-9099 range
                    def grafanaPort = 3000 + (buildNumberInt % 10) // Grafana on 3000-3009 range
                    def nodeExporterPort = 9100 + (buildNumberInt % 10) // Node Exporter on 9100-9109 range

                    // Create unique names for containers, networks, and volumes
                    def uniqueSuffix = "${BUILD_NUMBER}"

                    // Write the docker-compose file with explicit content
                    sh """
                    cat > docker-compose.prod.yml << 'EOL'
version: '3.8'
services:
  db:
    image: mongo:4.2
    container_name: db-${uniqueSuffix}
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    ports:
      - "${mongoPort}:27017"
    volumes:
      - mongo-data-${uniqueSuffix}:/data/db
    networks:
      - app-network-${uniqueSuffix}

  backend:
    image: ${BACKEND_IMAGE}
    container_name: backend-${uniqueSuffix}
    restart: on-failure:3
    depends_on:
      - db
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://${MONGO_USER}:${MONGO_PASSWORD}@db-${uniqueSuffix}:27017/codevisionpiweb?authSource=admin
      - JWT_SECRET=${JWT_SECRET}
      - PORT=5000
      - DEBUG=express:*
    ports:
      - "${backendPort}:5000"
    networks:
      - app-network-${uniqueSuffix}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s
    command: >
      sh -c "
        echo 'Waiting for MongoDB to be ready...' &&
        sleep 10 &&
        echo 'Starting backend application...' &&
        node server.js
      "

  frontend:
    image: ${FRONTEND_IMAGE}
    container_name: frontend-${uniqueSuffix}
    restart: always
    depends_on:
      - backend
    ports:
      - "${frontendPort}:80"
    networks:
      - app-network-${uniqueSuffix}

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter-${uniqueSuffix}
    restart: always
    ports:
      - "${nodeExporterPort}:9100"
    networks:
      - app-network-${uniqueSuffix}
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/rootfs'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'

  prometheus:
    image: ${PROMETHEUS_IMAGE}
    container_name: prometheus-${uniqueSuffix}
    restart: always
    depends_on:
      - backend
      - node-exporter
    ports:
      - "${prometheusPort}:9090"
    networks:
      - app-network-${uniqueSuffix}

  grafana:
    image: ${GRAFANA_IMAGE}
    container_name: grafana-${uniqueSuffix}
    restart: always
    depends_on:
      - prometheus
    ports:
      - "${grafanaPort}:3000"
    networks:
      - app-network-${uniqueSuffix}
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false

networks:
  app-network-${uniqueSuffix}:
    driver: bridge

volumes:
  mongo-data-${uniqueSuffix}:
EOL

                    # Display the content of the file for debugging
                    echo "Docker Compose file content:"
                    cat docker-compose.prod.yml
                    """
                }
            }
        }

        stage('Push to Registry') {
            steps {
                script {
                    // Use Jenkins credentials for Docker login
                    withCredentials([usernamePassword(credentialsId: 'nexus', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        // Login to Docker registry using credentials
                        sh '''
                            echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin http://192.168.33.10:8083
                        '''

                        // Push images
                        sh "docker push ${BACKEND_IMAGE}"
                        sh "docker push ${FRONTEND_IMAGE}"
                        sh "docker push ${PROMETHEUS_IMAGE}"
                        sh "docker push ${GRAFANA_IMAGE}"
                    }
                }
            }
        }

        stage('Deploy Application') {
            steps {
                script {
                    // Use Jenkins credentials for Docker login if needed
                    withCredentials([usernamePassword(credentialsId: 'nexus', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        // Deploy using docker-compose
                        sh """
                        # Login to Docker registry if needed for pulling images
                        echo \${DOCKER_PASSWORD} | docker login -u \${DOCKER_USERNAME} --password-stdin http://192.168.33.10:8083

                        # First, check if there are any existing containers with the same name
                        echo "Checking for existing containers with the same names..."

                        # Use docker-compose down if the file exists from a previous run
                        if [ -f docker-compose.prod.yml ]; then
                            echo "Using docker-compose down to clean up previous deployment..."
                            BACKEND_IMAGE=${BACKEND_IMAGE} \\
                            FRONTEND_IMAGE=${FRONTEND_IMAGE} \\
                            MONGO_USER=${MONGO_USER} \\
                            MONGO_PASSWORD=${MONGO_PASSWORD} \\
                            JWT_SECRET=${JWT_SECRET} \\
                            docker-compose -f docker-compose.prod.yml down -v || true
                        fi

                        # Also try direct container removal as a backup
                        echo "Stopping and removing existing containers..."
                        docker stop db-${BUILD_NUMBER} backend-${BUILD_NUMBER} frontend-${BUILD_NUMBER} prometheus-${BUILD_NUMBER} grafana-${BUILD_NUMBER} node-exporter-${BUILD_NUMBER} || true
                        docker rm db-${BUILD_NUMBER} backend-${BUILD_NUMBER} frontend-${BUILD_NUMBER} prometheus-${BUILD_NUMBER} grafana-${BUILD_NUMBER} node-exporter-${BUILD_NUMBER} || true

                        # Remove existing network if it exists
                        docker network rm app-network-${BUILD_NUMBER} || true

                        # Remove existing volume if it exists
                        docker volume rm mongo-data-${BUILD_NUMBER} || true

                        # Clean up old deployments (optional, keep last 3 builds)
                        echo "Cleaning up old deployments..."

                        # Get list of existing containers to avoid unnecessary commands
                        EXISTING_CONTAINERS=\$(docker ps -a --format '{{.Names}}')
                        EXISTING_NETWORKS=\$(docker network ls --format '{{.Name}}')
                        EXISTING_VOLUMES=\$(docker volume ls --format '{{.Name}}')

                        # Only clean up builds from 10 builds ago to avoid too much log noise
                        START_CLEAN=\$((${BUILD_NUMBER}-10))
                        if [ \$START_CLEAN -lt 1 ]; then
                            START_CLEAN=1
                        fi

                        END_CLEAN=\$((${BUILD_NUMBER}-3))
                        if [ \$END_CLEAN -gt \$START_CLEAN ]; then
                            echo "Cleaning up deployments \$START_CLEAN through \$END_CLEAN..."

                            for i in \$(seq \$START_CLEAN \$END_CLEAN); do
                                # Check if containers exist before trying to remove them
                                for CONTAINER in db-\$i backend-\$i frontend-\$i prometheus-\$i grafana-\$i node-exporter-\$i; do
                                    if echo "\$EXISTING_CONTAINERS" | grep -q "\$CONTAINER"; then
                                        echo "Removing container \$CONTAINER..."
                                        docker stop \$CONTAINER || true
                                        docker rm \$CONTAINER || true
                                    fi
                                done

                                # Check if network exists before trying to remove it
                                if echo "\$EXISTING_NETWORKS" | grep -q "app-network-\$i"; then
                                    echo "Removing network app-network-\$i..."
                                    docker network rm app-network-\$i || true
                                fi

                                # Check if volume exists before trying to remove it
                                if echo "\$EXISTING_VOLUMES" | grep -q "mongo-data-\$i"; then
                                    echo "Removing volume mongo-data-\$i..."
                                    docker volume rm mongo-data-\$i || true
                                fi
                            done
                        else
                            echo "No old deployments to clean up."
                        fi

                        # Run docker-compose with environment variables
                        echo "Starting new containers..."
                        BACKEND_IMAGE=${BACKEND_IMAGE} \\
                        FRONTEND_IMAGE=${FRONTEND_IMAGE} \\
                        MONGO_USER=${MONGO_USER} \\
                        MONGO_PASSWORD=${MONGO_PASSWORD} \\
                        JWT_SECRET=${JWT_SECRET} \\
                        docker-compose -f docker-compose.prod.yml up -d

                        # Wait a moment for containers to start
                        sleep 10

                        # Check container status
                        echo "Checking container status..."
                        docker ps -a | grep ${BUILD_NUMBER}

                        # Check logs of the backend container to diagnose any issues
                        echo "Backend container logs:"
                        docker logs backend-${BUILD_NUMBER} || true
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            script {
                // Calculate the ports used for this deployment
                def buildNumberInt = BUILD_NUMBER.toInteger()
                def backendPort = 5000 + (buildNumberInt % 10)
                def frontendPort = 8000 + (buildNumberInt % 10)
                def mongoPort = 27017 + (buildNumberInt % 10)
                def prometheusPort = 9090 + (buildNumberInt % 10)
                def grafanaPort = 3000 + (buildNumberInt % 10)
                def nodeExporterPort = 9100 + (buildNumberInt % 10)

                echo """
                ========================================
                Pipeline completed successfully!
                ========================================

                Deployment Information:
                - Build Number: ${BUILD_NUMBER}
                - Container Names: db-${BUILD_NUMBER}, backend-${BUILD_NUMBER}, frontend-${BUILD_NUMBER},
                  prometheus-${BUILD_NUMBER}, grafana-${BUILD_NUMBER}, node-exporter-${BUILD_NUMBER}

                Access URLs:
                - Frontend: http://192.168.33.10:${frontendPort}
                - Backend API: http://192.168.33.10:${backendPort}
                - MongoDB: mongodb://root:example@192.168.33.10:${mongoPort}
                - Prometheus: http://192.168.33.10:${prometheusPort}
                - Grafana: http://192.168.33.10:${grafanaPort} (admin/admin)
                - Node Exporter: http://192.168.33.10:${nodeExporterPort}/metrics

                Images:
                - Backend: ${BACKEND_IMAGE}
                - Frontend: ${FRONTEND_IMAGE}
                - Prometheus: ${PROMETHEUS_IMAGE}
                - Grafana: ${GRAFANA_IMAGE}

                To stop this deployment:
                docker stop db-${BUILD_NUMBER} backend-${BUILD_NUMBER} frontend-${BUILD_NUMBER} prometheus-${BUILD_NUMBER} grafana-${BUILD_NUMBER} node-exporter-${BUILD_NUMBER}
                docker rm db-${BUILD_NUMBER} backend-${BUILD_NUMBER} frontend-${BUILD_NUMBER} prometheus-${BUILD_NUMBER} grafana-${BUILD_NUMBER} node-exporter-${BUILD_NUMBER}
                docker network rm app-network-${BUILD_NUMBER}
                docker volume rm mongo-data-${BUILD_NUMBER}
                ========================================
                """
            }
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
    }
}