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
                        // Create a simple build script
                        writeFile file: 'build.sh', text: '''#!/bin/sh
export NODE_OPTIONS="--max-old-space-size=4096"
echo "Building backend..."

# Create a simple webpack config if needed
if [ ! -f webpack.dev.js ]; then
  cat > webpack.dev.js << 'EOF'
const path = require('path');

module.exports = {
  entry: './server.js',
  target: 'node',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dev_build'),
    filename: 'main.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
EOF
fi

# Install necessary packages
npm install --no-save --yes webpack webpack-cli babel-loader @babel/core @babel/preset-env

# Run webpack
npx webpack --config webpack.dev.js --mode development
'''
                        sh 'chmod +x build.sh'
                        sh './build.sh'
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

# Ensure Vite is installed (with --yes to avoid prompts)
npm install --no-save --yes vite@latest @vitejs/plugin-react vite-plugin-svgr

# Create a simplified tsconfig for the build
cat > tsconfig.simple.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
EOF

# Skip TypeScript build and just use Vite directly
echo "Running Vite build..."
npx vite build --config vite.config.js
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