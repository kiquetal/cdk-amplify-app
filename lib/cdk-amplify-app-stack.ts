import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam'; // Added IAM import
import * as path from 'path';

export class CdkAmplifyAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a role with IoT permissions for the Lambda
    const lambdaRole = new iam.Role(this, 'AttachIotPolicyLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Lambda function that attaches IoT policies to identities',
    });

    // Add basic Lambda execution permissions
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    );

    // Add IoT policy management permissions
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'iot:AttachPolicy',
        'iot:AttachPrincipalPolicy',
        'iot:DetachPolicy',
        'iot:DetachPrincipalPolicy',
        'iot:ListAttachedPolicies',
        'iot:ListPrincipalPolicies',
        'iot:CreatePolicy',
        'iot:DeletePolicy',
        'iot:GetPolicy',
        'iot:ListPolicies',
      ],
      resources: ['*'],
    }));


    const attachIotPolicyLambda = new lambda.Function(this, 'AttachIotPolicy', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      handler: 'attachIotPolicy.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/lambdas'), {
        bundling: {
           image: lambda.Runtime.NODEJS_LATEST.bundlingImage,
          environment: {
             npm_config_cache: '/tmp/npm_cache',
            npm_config_update_notifier: 'false',
          },
          command: [
            'bash',
            '-c',
            'npm install && npm run build && cp /asset-input/attachIotPolicy.js /asset-output',
          ],
        },
      }),
      role: lambdaRole, // Assign the custom role with IoT permissions
    });
  }
}
