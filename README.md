# AWS IoT Trivia Challenge Game

### Backend
- **AWS CDK** - Infrastructure as Code
- **AWS Lambda** - Serverless compute
- **AWS IoT Core** - IoT device management and messaging
- **Amazon API Gateway** - RESTful API endpoints
- **TypeScript** - Programming language for Lambda functions

### Development Tools
- **Node.js** - Runtime environment
- **AWS SDK v3** - AWS service integration
- **npm/yarn** - Package management

## Recent Updates

### Lambda Integration for Challenge Button
The trivia app now includes direct Lambda function integration when users click the challenge button:

- **Remote Lambda Invocation** - Using AWS SDK v3 to invoke Lambda functions directly from the frontend
- **Challenge Processing** - Backend Lambda processes user challenges and matchmaking
- **Real-time Updates** - Challenge results are pushed back to users via IoT Core
- **Optimized SDK Bundle** - Lightweight AWS SDK v3 bundle (/trivia/aws-bundle-v3) with only required clients

Example usage:
```javascript
// Import the AWS bundle
import AWS from './aws-bundle-v3';

// Create configured clients
const clients = AWS.createClients({
  region: 'us-east-1',
  credentials: /* credentials */
});

// Handle challenge button click
async function handleChallengeClick() {
  try {
    const command = new AWS.Lambda.InvokeCommand({
      FunctionName: 'trivia-challenge-function',
      Payload: JSON.stringify({
        action: 'createChallenge',
        playerId: currentPlayer.id,
        difficulty: selectedDifficulty
      })
    });
    
    const response = await clients.lambda.send(command);
    // Process challenge response
  } catch (error) {
    console.error('Challenge request failed:', error);
  }
}
```

## Project Structure

- `/trivia` - Frontend Amplify application
- `/lib` - CDK infrastructure code

## Architecture

- Frontend hosted on AWS S3/CloudFront via CDK
  - Static assets served through CloudFront CDN
  - S3 bucket configured as origin for CloudFront
  - Secure access via CloudFront origin access identity
- AWS IoT for real-time communication between players
- Amplify for authentication and API integration
- CDK for infrastructure as code

## Infrastructure Details

The CDK stack creates:
1. An S3 bucket to store the built Trivia app (/trivia/dist)
2. A CloudFront distribution with:
   - S3 bucket as origin
   - HTTPS-only access
   - Default root object: index.html
   - Proper cache behaviors for static assets
3. Required IAM roles and policies

## Development

### Amplify Gen2 (ampx) Development
```bash
# Install ampx if not already installed
npm add --save-dev @aws-amplify/backend@latest @aws-amplify/backend-cli@latest typescript

# Start the sandbox environment
npx ampx sandbox

# Common ampx sandbox commands
npx ampx sandbox init      # Initialize a new sandbox
npx ampx sandbox start    # Start the sandbox environment
npx ampx sandbox status   # Check sandbox status
npx ampx sandbox stop     # Stop the sandbox
npx ampx sandbox clean    # Clean up sandbox resources
```

### Frontend (Trivia App)
```bash
cd trivia
npm install
npm run dev    # Development server
npm run build  # Build for production
```

### Infrastructure (CDK)
```bash
npm install
npm run build
npx cdk deploy
```

The CDK stack will automatically deploy the built frontend (/trivia/dist) to an S3 bucket and set up the required AWS IoT resources.

### Testing Lambda Functions Locally with AWS SAM

AWS SAM (Serverless Application Model) allows you to test your Lambda functions locally before deploying to AWS.

#### Prerequisites
1. Install AWS SAM CLI:
   ```bash
   # For macOS
   brew install aws-sam-cli

   # For Windows (using Chocolatey)
   choco install aws-sam-cli

   # For Linux
   pip install aws-sam-cli
   ```

2. Ensure Docker is installed and running (SAM uses Docker containers to emulate Lambda environment)

#### Testing Lambda Functions Locally

1. Generate a SAM template from your CDK code:
   ```bash
   npx cdk synth --no-staging > template.yaml
   ```

2. Identify the function you want to test from the template file

3. Run the Lambda function locally:
   ```bash
   # Basic invocation
   sam local invoke [FunctionLogicalId] -e events/event.json

   # With environment variables
   sam local invoke [FunctionLogicalId] -e events/event.json --env-vars env.json

   # Example
   sam local invoke TriviaGameFunction -e events/game-event.json
   ```

4. To test with API Gateway requests:
   ```bash
   # Start local API Gateway
   sam local start-api

   # Then access your endpoint at http://localhost:3000/your-endpoint
   ```

5. For debugging Lambda functions:
   ```bash
   # Add --debug-port flag to enable debugging
   sam local invoke [FunctionLogicalId] -e events/event.json --debug-port 5858

   # Then connect your IDE debugger to port 5858
   ```

#### Sample Event JSON Files

Create a directory called `events` to store sample event JSON files:

```bash
mkdir -p events
```

Example event file for IoT topic message (`events/iot-event.json`):
```json
{
  "message": "Hello from IoT",
  "username": "player1",
  "timestamp": "2023-06-15T12:00:00Z"
}
```

#### Environment Variables File

Create an `env.json` file to provide environment variables:
```json
{
  "FunctionName": {
    "ENVIRONMENT": "local",
    "IOT_ENDPOINT": "your-iot-endpoint.iot.region.amazonaws.com",
    "IOT_TOPIC": "trivia"
  }
}
```

## Useful Commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

`
