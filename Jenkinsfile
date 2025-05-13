pipeline {
    agent any

    environment {
        // Registry configuration
        registryCredentials = "nexus"
        registry = "192.168.33.10:8083"

        // Image names with build number for versioning
        BACKEND_IMAGE = "${registry}/piwebapp-backend:${BUILD_NUMBER}"
        FRONTEND_IMAGE = "${registry}/piwebapp-frontend:${BUILD_NUMBER}"

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
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('Frontend') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('Backend') {
                    script {
                        sh 'npm run build-dev'
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('Frontend') {
                    script {
                        // Create a simplified build script that doesn't rely on TypeScript project references
                        writeFile file: 'build.sh', text: '''#!/bin/sh
export NODE_OPTIONS="--max-old-space-size=4096"
echo "Building frontend..."
# Skip TypeScript build and just use Vite directly
npx vite build
'''
                        sh 'chmod +x build.sh'
                        sh './build.sh'
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
COPY package*.json ./
RUN npm ci --only=production
COPY . .
COPY dev_build ./dist
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
            }
        }

        stage('Create Docker Compose File') {
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
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
    }
}