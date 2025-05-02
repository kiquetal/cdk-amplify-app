// Import AWS SDK clients
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import {
  IoTClient,
  AttachPolicyCommand,
  DescribeEndpointCommand
} from "@aws-sdk/client-iot";
import {
  LambdaClient,
  InvokeCommand
} from "@aws-sdk/client-lambda";

// Create a namespace for AWS services
const AWS = {
  // Client constructors
  CognitoIdentityClient,
  IoTClient,
  LambdaClient,

  // Commands
  IoT: {
    AttachPolicyCommand,
    DescribeEndpointCommand
  },
  Lambda: {
    InvokeCommand
  },

  // Helper function to create preconfigured clients
  createClients: (config = {}) => {
    const defaultConfig = {
      region: config.region || 'us-east-1',
      credentials: config.credentials
    };

    return {
      cognito: new CognitoIdentityClient(defaultConfig),
      iot: new IoTClient(defaultConfig),
      lambda: new LambdaClient(defaultConfig)
    };
  }
};

// Expose to window object for browser usage
window.AWS = AWS;

// Also export for module usage
export default AWS;
