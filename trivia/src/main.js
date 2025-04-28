import './style.css';
import './waitingList.css';
import { Amplify } from "aws-amplify";
import { fetchAuthSession } from 'aws-amplify/auth';
import { ConsoleLogger } from 'aws-amplify/utils';
import { CONNECTION_STATE_CHANGE, ConnectionState } from '@aws-amplify/pubsub';
import { Hub } from 'aws-amplify/utils';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { createApp, ref } from 'vue'; // Import createApp and ref from Vue
const logger = new ConsoleLogger('MyApp', 'DEBUG');
import { PubSub } from "@aws-amplify/pubsub";
import amplify_outputs from "../amplify_outputs.json";
logger.debug("PubSub configured", Amplify.getConfig().PubSub);

Amplify.configure(amplify_outputs);
let pubsub = null;
let currentUsername = '';
let activeSubscription = null;
let connectionMonitorActive = false;

// Replace the existing Hub.listen with our connection manager
function waitForConnection(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    // Set timeout to reject the promise if connection takes too long
    const timeoutId = setTimeout(() => {
      reject(new Error(`Connection timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    // Listen for connection state changes
Hub.listen('pubsub', (data) => {
      const { payload } = data;
      if (payload.event === CONNECTION_STATE_CHANGE) {
        const connectionState = payload.data.connectionState;
        logger.log(`Connection state: ${connectionState}`);

        if (connectionState === ConnectionState.Connected) {
          // Connection established - clean up and resolve
          clearTimeout(timeoutId);
          resolve();
        } else if (connectionState === ConnectionState.ConnectionLost) {
          // Connection lost - clean up and reject
          clearTimeout(timeoutId);
          reject(new Error('Connection lost'));
        }
      }
    });
  });
}

async function initializePubSub() {
  try {

    // 1. Verify authentication
    const { credentials, identityId } = await fetchAuthSession();

    logger.log("Credentials:", identityId); // 🛠️
    if (credentials) {
      pubsub = new PubSub({
        region: 'us-east-1',
        endpoint: 'wss://a2yqm0wer1ijho-ats.iot.us-east-1.amazonaws.com/mqtt',
        provider: 'AWSIoTProvider',
      });
      await subscribeToIoTTopic();
      console.log("subscription active");
      await waitForConnection(10000);
    } else {
      throw new Error('No credentials found');
    }

    // Add connection monitoring after PubSub is initialized
    setupConnectionMonitoring();

  } catch(error) {
    console.error('PubSub Init Error:', error);
    throw error; // Re-throw to handle in caller
  }
}

// Function modified to work with Vue app
async function addUserToWaitingList(app) {
  try {
    console.log("Starting addUserToWaitingList");

    // Using prompt temporarily, we'll improve this with a modal later
    const username = prompt("Please enter your username:");
    console.log("Username prompt result:", username);

    if (!username) {
      console.log("No username provided, stopping");
      return;
    }

    currentUsername = username;

    // Update the Vue app's currentUser
    app.currentUser = username;

    // 1. Publish user to IoT
    await publishUserToIoT(username);

    // Add mock users to the Vue app's userList
    if (app.userList.length === 0) {
      ['Alice', 'Bob', 'Charlie', 'Diana'].forEach(user => {
        if (user !== currentUsername) {
          app.userList.push({ name: user });
        }
      });
    }
  } catch (error) {
    console.error('Error adding user to waiting list:', error);
  }
}

function subscribeToIoTTopic() {
  return new Promise((resolve) => {
    logger.log('Subscribing to trivia/users topic...'); // 🛠️

    activeSubscription = pubsub.subscribe({
      topics: ["trivia"]
    })
    activeSubscription.subscribe({
      next:(data)=> {
        logger.log('Received message:', data);

        // Process different message types
        if (data.value) {
          // Check message type
          if (data.value.type === 'logout') {
            // Handle logout message
            const username = data.value.username;
            logger.log(`User ${username} has logged out`);
            // Vue app reference will be available globally
            if (window.vueApp) {
              window.vueApp.removeUser(username);
            }
          } else if (data.value.msg) {
            // Handle regular messages
            const message = data.value.msg;
            logger.log('Received regular message:', message);

            if (message.startsWith('Ha ingresado ')) {
              const username = message.replace('Ha ingresado ', '');
              if (username !== currentUsername && window.vueApp) {
                window.vueApp.addUser(username);
              }
            }
          }
        }
      },
      error: (error) => {
        logger.error('Subscription error:', error); // 🛠️
      },
      complete: () => {
        logger.log('Subscription completed'); // 🛠️
      }
    });

    resolve();
  });
}

// Updated publish function
async function publishUserToIoT(username) {
  try {
    await pubsub.publish({
      topics: ['trivia'], // Use array format
      message: {
        type: 'login',
        username: username,
        msg: `Ha ingresado ${username}`,
        timestamp: new Date().toISOString()
      },
    });
    logger.log('Published message:', username); // 🛠️
  } catch (error) {
    console.error('Publish error:', error);
    throw error;
  }
}

// New function to publish logout messages
async function publishUserLogout(username) {
  try {
    await pubsub.publish({
      topics: ['trivia'], // Make sure to use array format
      message: {
        type: 'logout',
        username: username,
        timestamp: new Date().toISOString()
      },
    });
    logger.log(`Published logout message for ${username}`);
  } catch (error) {
    logger.error('Error publishing logout message:', error);
    throw error;
  }
}

// Function to monitor connection state and detect disconnections
function setupConnectionMonitoring() {
  if (connectionMonitorActive) return;

  connectionMonitorActive = true;
  logger.log('Setting up connection state monitoring');

  Hub.listen('pubsub', async (data) => {
    const { payload } = data;
    if (payload.event === CONNECTION_STATE_CHANGE) {
      const connectionState = payload.data.connectionState;
      logger.log(`Connection state: ${connectionState}`);

      if (connectionState === ConnectionState.ConnectionLost ||
          connectionState === ConnectionState.Disconnected) {
        logger.log('Connection closed, sending logout notification');
        try {
          if (currentUsername && pubsub) {
            await publishUserLogout(currentUsername);
          }
        } catch (error) {
          logger.error('Failed to send logout notification:', error);
        }
      }
    }
  });

  // Handle page unload events
  window.addEventListener('beforeunload', async (event) => {
    logger.log('Page is being unloaded, notifying logout');
    if (currentUsername && pubsub) {
      try {
        // Send a synchronous request to ensure it completes before page unloads
        await publishUserLogout(currentUsername);
      } catch (error) {
        logger.error('Error sending logout on page unload:', error);
      }
    }
  });
}

// Add function to invoke Lambda
async function invokeLambda(functionName, payload) {
  try {
    // Get credentials from current session - reuse existing auth
    const { credentials } = await fetchAuthSession();

    if (!credentials) {
      throw new Error('No credentials available to invoke Lambda');
    }

    // Create Lambda client using the credentials
    const lambdaClient = new LambdaClient({
      region: 'us-east-1', // Use same region as your other AWS services
      credentials: credentials
    });

    // Prepare the command with the function name and payload
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
      InvocationType: 'RequestResponse' // For synchronous execution (use 'Event' for async)
    });

    // Send the command to Lambda
    logger.log(`Invoking Lambda function: ${functionName}`);
    const response = await lambdaClient.send(command);

    // Handle the response
    if (response.StatusCode === 200) {
      // Convert the Uint8Array response to a string, then to JSON
      const responseData = new TextDecoder().decode(response.Payload);
      logger.log('Lambda response:', responseData);

      try {
        return JSON.parse(responseData);
      } catch (e) {
        return responseData;
      }
    } else {
      throw new Error(`Lambda invocation failed with status: ${response.StatusCode}`);
    }
  } catch (error) {
    logger.error('Lambda invocation error:', error);
    throw error;
  }
}

// Define Vue App component
const App = {
  data() {
    return {
      userList: [],
      currentUser: '',
      newUsername: '', // For v-model binding in potential form
      loading: false,
      error: null
    };
  },
  mounted() {
    // Store a reference to the Vue app instance
    window.vueApp = this;

    // Initialize PubSub and add user to waiting list
    this.loading = true;
    initializePubSub()
      .then(() => {
        console.log("PubSub initialized successfully");
        return addUserToWaitingList(this);
      })
      .catch((error) => {
        console.error("Error initializing PubSub:", error);
        this.error = error.message;
      })
      .finally(() => {
        this.loading = false;
      });
  },
  methods: {
    challengeUser(username) {
      try {
        alert("Challenging " + username + " to a game!");
      } catch (error) {
        console.error('Error challenging user:', error);
        alert(`Error challenging ${username}: ${error.message}`);
      }
    },
    addUser(username) {
      // Check if user already exists in the list
      if (!this.userList.some(user => user.name === username)) {
        this.userList.push({ name: username });
      }
    },
    removeUser(username) {
      this.userList = this.userList.filter(user => user.name !== username);
    }
  },
  template: `
    <div>
      <div v-if="loading">Loading...</div>
      <div v-if="error" class="error">{{ error }}</div>
      
      <div v-if="!loading && !error" id="waiting-list">
        <h2>Waiting List</h2>
        
        <!-- Input for a potential username entry form -->
        <div class="username-input" v-if="!currentUser">
          <input v-model="newUsername" placeholder="Enter your username" />
          <button @click="enterWaitingList">Enter</button>
        </div>
        
        <div id="waiting-list-content">
          <!-- Other users -->
          <div v-for="user in userList" :key="user.name" class="user-entry">
            <p>User: {{ user.name }}</p>
            <button class="challenge-btn" @click="challengeUser(user.name)">
              Challenge
            </button>
          </div>
          
          <!-- Current user -->
          <div v-if="currentUser" class="user-entry current-user">
            <p>User: {{ currentUser }} (You)</p>
          </div>
        </div>
      </div>                                            
    </div>
  `
};

// Create and mount Vue app
const vueApp = createApp(App);

// Check if the mounting element exists
const mountElement = document.getElementById('app');
if (!mountElement) {
  // Create a mount element if it doesn't exist
  console.warn("No #app element found in HTML. Creating one dynamically.");
  const appDiv = document.createElement('div');
  appDiv.id = 'app';
  document.body.appendChild(appDiv);
}

try {
  vueApp.mount('#app');
  console.log("Vue app mounted successfully");
} catch (error) {
  console.error("Failed to mount Vue app:", error);
}

// No need for the try-catch block here since we're initializing in the Vue component

