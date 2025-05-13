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

        // Using Jenkins credentials for secure storage
        MONGO_USER = credentials('mongo-user')
        MONGO_PASSWORD = credentials('mongo-password')
        JWT_SECRET = credentials('jwt-secret')
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
                        // Skip JavaScript/TypeScript analysis completely
                        sh """
                        export SONAR_SCANNER_OPTS="-Xmx2048m -XX:+HeapDumpOnOutOfMemoryError"
                        ${scannerHome}/bin/sonar-scanner \\
                        -Dsonar.projectKey=piweb \\
                        -Dsonar.projectName=Piweb \\
                        -Dsonar.sources=. \\
                        -Dsonar.exclusions=**/*.js,**/*.jsx,**/*.ts,**/*.tsx,**/node_modules/**,**/dist/**,**/build/**,**/coverage/**,**/*.min.js,**/*.css,**/*.html,**/*.json,**/*.properties,**/*.bat,**/*.sh,**/*.xml,**/*.md \\
                        -Dsonar.sourceEncoding=UTF-8 \\
                        -Dsonar.host.url=${SONAR_HOST_URL} \\
                        -Dsonar.login=${SONAR_AUTH_TOKEN}
                        """
                    }

                    // Optional: Wait for quality gate
                    timeout(time: 5, unit: 'MINUTES') {
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

  prometheus:
    image: prom/prometheus
    container_name: prometheus
    restart: always
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - app-network

  grafana:
    image: grafana/grafana
    container_name: grafana
    restart: always
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_ADMIN_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
    depends_on:
      - prometheus
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mongo-data:
  grafana-data:
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
                        withCredentials([
                            string(credentialsId: 'grafana-admin-password', variable: 'GRAFANA_ADMIN_PASSWORD')
                        ]) {
                            sh """
                            BACKEND_IMAGE=${BACKEND_IMAGE} \\
                            FRONTEND_IMAGE=${FRONTEND_IMAGE} \\
                            MONGO_USER=${MONGO_USER} \\
                            MONGO_PASSWORD=${MONGO_PASSWORD} \\
                            JWT_SECRET=${JWT_SECRET} \\
                            GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD} \\
                            docker-compose -f docker-compose.prod.yml up -d
                            """
                        }
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
                            withCredentials([
                                string(credentialsId: 'grafana-admin-password', variable: 'GRAFANA_ADMIN_PASSWORD')
                            ]) {
                                sh '''
                                docker start grafana || docker run -d --name grafana \
                                -p 3000:3000 \
                                -e GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-admin} \
                                -e GF_USERS_ALLOW_SIGN_UP=false \
                                grafana/grafana
                                '''
                            }
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