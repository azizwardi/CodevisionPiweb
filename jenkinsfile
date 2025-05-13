pipeline {
    agent any

    environment {
        // Registry configuration
        registryCredentials = "nexus"
        registry = "192.168.33.10:8083"

        // Image names with build number for versioning
        BACKEND_IMAGE = "${registry}/piwebapp-backend:${BUILD_NUMBER}"
        FRONTEND_IMAGE = "${registry}/piwebapp-frontend:${BUILD_NUMBER}"

        // Enable Docker BuildKit for faster builds
        DOCKER_BUILDKIT = "1"

        // Using hardcoded MongoDB credentials (NOT RECOMMENDED FOR PRODUCTION)
        MONGO_USER = "root"
        MONGO_PASSWORD = "example"

        // Using a fixed JWT secret (NOT RECOMMENDED FOR PRODUCTION)
        JWT_SECRET = "development_jwt_secret_replace_in_production"
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
                            sh 'npm install'
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('Frontend') {
                            sh 'npm install'
                        }
                    }
                }
            }
        }

        stage('Lint') {
            parallel {
                stage('Backend Lint') {
                    steps {
                        dir('Backend') {
                            script {
                                sh 'echo "No lint specified for backend"'
                                // When ESLint is configured: sh 'npm run lint'
                            }
                        }
                    }
                }
                stage('Frontend Lint') {
                    steps {
                        dir('Frontend') {
                            script {
                                sh 'npm run lint'
                            }
                        }
                    }
                }
            }
        }

        stage('Unit Test') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('Backend') {
                            script {
                                sh 'echo "No tests specified"'
                                // When tests are implemented: sh 'npm test'
                            }
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('Frontend') {
                            script {
                                sh 'echo "No tests specified"'
                                // When tests are implemented: sh 'npm test'
                            }
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'scanner'
                    withSonarQubeEnv('scanner') {
                        sh """
                        ${scannerHome}/bin/sonar-scanner \\
                        -Dsonar.projectKey=piweb \\
                        -Dsonar.projectName=Piweb \\
                        -Dsonar.sources=. \\
                        -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/coverage/** \\
                        -Dsonar.javascript.lcov.reportPaths=**/coverage/lcov.info
                        """
                    }

                    // Optional: Wait for quality gate
                    timeout(time: 10, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: false
                    }
                }
            }
        }

        stage('Build Application') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('Backend') {
                            script {
                                sh 'chmod +x node_modules/.bin/webpack'
                                sh 'npm run build-dev'
                            }
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('Frontend') {
                            script {
                                sh 'npm run build'
                            }
                        }
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
                                // Create a production Dockerfile
                                writeFile file: 'Dockerfile.prod', text: '''
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
COPY dev_build ./dist
EXPOSE 5000
CMD ["node", "server.js"]
'''

                                // Build the backend image
                                sh "docker build -t ${BACKEND_IMAGE} -f Dockerfile.prod ."
                            }
                        }
                    }
                }
                stage('Frontend Image') {
                    steps {
                        dir('Frontend') {
                            script {
                                // Create a production Dockerfile
                                writeFile file: 'Dockerfile.prod', text: '''
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
'''

                                // Create nginx config
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

                                // Build the frontend image
                                sh "docker build -t ${FRONTEND_IMAGE} -f Dockerfile.prod ."
                            }
                        }
                    }
                }
            }
        }

        stage('Create Docker Compose Production') {
            steps {
                script {
                    writeFile file: 'docker-compose.prod.yml', text: """
version: '3.8'
services:
  db:
    image: mongo:4.2
    container_name: db
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: \${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: \${MONGO_PASSWORD}
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - app-network

  backend:
    image: ${BACKEND_IMAGE}
    container_name: backend
    restart: always
    depends_on:
      - db
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://\${MONGO_USER}:\${MONGO_PASSWORD}@db:27017/codevisionpiweb?authSource=admin
      - JWT_SECRET=\${JWT_SECRET}
      - PORT=5000
    ports:
      - "5000:5000"
    networks:
      - app-network

  frontend:
    image: ${FRONTEND_IMAGE}
    container_name: frontend
    restart: always
    depends_on:
      - backend
    ports:
      - "80:80"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mongo-data:
"""
                }
            }
        }

        stage('Push to Registry') {
            steps {
                script {
                    docker.withRegistry("http://${registry}", registryCredentials) {
                        sh "docker push ${BACKEND_IMAGE}"
                        sh "docker push ${FRONTEND_IMAGE}"
                    }
                }
            }
        }

        stage('Deploy Application') {
            steps {
                script {
                    docker.withRegistry("http://${registry}", registryCredentials) {
                        sh "docker pull ${BACKEND_IMAGE}"
                        sh "docker pull ${FRONTEND_IMAGE}"

                        // Deploy using docker-compose
                        sh """
                        BACKEND_IMAGE=${BACKEND_IMAGE} \\
                        FRONTEND_IMAGE=${FRONTEND_IMAGE} \\
                        MONGO_USER=${MONGO_USER} \\
                        MONGO_PASSWORD=${MONGO_PASSWORD} \\
                        JWT_SECRET=${JWT_SECRET} \\
                        docker-compose -f docker-compose.prod.yml up -d
                        """
                    }
                }
            }
        }

        stage('Run Monitoring') {
            parallel {
                stage('Run Prometheus') {
                    steps {
                        script {
                            sh 'docker start prometheus || docker run -d --name prometheus -p 9090:9090 -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus'
                        }
                    }
                }

                stage('Run Grafana') {
                    steps {
                        script {
                            sh 'docker start grafana || docker run -d --name grafana -p 3000:3000 grafana/grafana'
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            // Clean up workspace
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
            // You can add notifications here (email, Slack, etc.)
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
            // You can add notifications here (email, Slack, etc.)
        }
    }
}