// This is the start of my Jenkins Pipeline.
pipeline {
    // Jenkins can use any available computer to run my pipeline steps.
    agent any
    // These are the main parts (stages) of my pipeline.
    stages {
        // --- Stage 1: Get My Code ---
        stage('Checkout Code') {
            steps {
                // I download my project code from GitHub.
                // IMPORTANT: This MUST match your GitHub's default branch.
                git url: 'https://github.com/LGenSOC/bstack-selenium-suite.git',
                    branch: 'master' // <--- Ensure this is 'master' or 'main' as per your GitHub repo
            }
        }
         // --- Stage 2: Install Project Tools ---
        stage('Install Dependencies') {
            steps {
                // Let's see where Jenkins is and what files are here!
                sh 'pwd'
                sh 'ls -la' // List all files and directories in the current working directory
                sh 'rm -rf node_modules'          // Delete the entire node_modules folder
                sh 'rm -f package-lock.json'     // Delete package-lock.json
                sh 'npm cache clean --force' 

                // I run 'npm install' to get all the necessary Node.js packages.
                sh 'npm install'
            }
        }

        // NEW STAGE: Verify BrowserStack Connection (Added for debugging)
        stage('Verify BrowserStack Auth') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'browserstack-auth',
                    usernameVariable: 'BROWSERSTACK_USERNAME',
                    passwordVariable: 'BROWSERSTACK_ACCESS_KEY'
                )]) {
                    sh '''
                        echo "=== Testing BrowserStack Credentials ==="
                        echo "Username: $BROWSERSTACK_USERNAME"
                        echo "Access Key Length: ${#BROWSERSTACK_ACCESS_KEY} chars"
                        
                        # This will fail immediately if credentials are wrong
                        curl -u "$BROWSERSTACK_USERNAME:$BROWSERSTACK_ACCESS_KEY" \
                        https://api.browserstack.com/automate/plan.json
                    '''
                }
            }
        }
         // --- Stage 3: Run My Tests ---
        stage('Run Tests on BrowserStack') {
            steps {
                // Let's confirm it's there with the correct casing
                sh 'ls -la Tests/'

                // NEW: Securely inject BrowserStack credentials from Jenkins vault
                withCredentials([usernamePassword(
                    credentialsId: 'browserstack-auth', // Must match your Jenkins credential ID
                    usernameVariable: 'BROWSERSTACK_USERNAME', 
                    passwordVariable: 'BROWSERSTACK_ACCESS_KEY'
                )]) {
                    // DEBUG: Verify credentials are loaded (masked in logs)
                    sh 'echo "Jenkins injected BROWSERSTACK_USERNAME: $BROWSERSTACK_USERNAME"'
                    sh 'echo "Jenkins injected BROWSERSTACK_ACCESS_KEY length: ${#BROWSERSTACK_ACCESS_KEY} chars"'

                    // Original test command now uses Jenkins-provided credentials
                    sh 'npx cross-env BROWSERSTACK_USERNAME=$BROWSERSTACK_USERNAME BROWSERSTACK_ACCESS_KEY=$BROWSERSTACK_ACCESS_KEY npm test'
                }
            }
        }
    }
    // This section runs after all stages, for cleanup.
    post {
        always {
            // I clean up my project's workspace.
            cleanWs()
        }
    }
}