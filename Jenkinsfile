pipeline {
    agent any

    environment {
        PATH = "${WORKSPACE}/Backend/node_modules/.bin:${env.PATH}"
        registryCredentials = "nexus"
        registry = "192.168.33.10:8083"
    }

    stages {
        stage('Install Dependencies') {
            steps {
                dir('Backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Fix Permissions') {
            steps {
                dir('Backend') {
                    sh 'chmod +x node_modules/.bin/nodemon'
                    sh 'chmod +x node_modules/.bin/webpack'
                }
            }
        }

        stage('Unit Test') {
            steps {
                dir('Backend') {
                    script {
                        sh 'echo "No tests specified"'
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'scanner'
                    withSonarQubeEnv('scanner') {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }

        stage('Start Dev Server') {
            steps {
                dir('Backend') {
                    script {
                        sh 'npm run build-dev'
                    }
                }
            }
        }

        stage('Building images') { 
            steps {
                dir('Backend') {
                    script {
                        sh 'docker-compose build'
                    }
                }
            }
        }

        stage('Deploy to Nexus') { 
            steps {
                script {
                    docker.withRegistry("http://${registry}", registryCredentials) {
                        sh 'docker push $registry/nodemongoapp:5.0'
                    }
                }
            }
        }
    }

    post {
        failure {
            echo '❌ Pipeline failed. Check logs.'
        }
        success {
            echo '✅ Pipeline succeeded!'
        }
    }
}
