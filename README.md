# AWS IoT Trivia Challenge Game

A real-time multiplayer trivia game built with AWS CDK and Amplify. Players can challenge each other to answer questions in real-time using AWS IoT for communication.

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

## Useful Commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

