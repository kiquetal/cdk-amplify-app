import './style.css';
import './waitingList.css';
import { Amplify } from "aws-amplify";
import { fetchAuthSession } from 'aws-amplify/auth';
import { ConsoleLogger } from 'aws-amplify/utils';
import { CONNECTION_STATE_CHANGE, ConnectionState } from '@aws-amplify/pubsub';
import { Hub } from 'aws-amplify/utils';

const logger = new ConsoleLogger('MyApp', 'DEBUG');



import { PubSub } from "@aws-amplify/pubsub";
import amplify_outputs from "../amplify_outputs.json";
logger.debug("PubSub configured", Amplify.getConfig().PubSub);

Amplify.configure(amplify_outputs);
let pubsub = null;
let currentUsername = '';
let activeSubscription = null;

// New: Cleanup function to prevent memory leaks
function cleanup() {
  if(activeSubscription) {
    activeSubscription.unsubscribe();
    activeSubscription = null;
  }
}



Hub.listen('pubsub', (data) => {
  const { payload } = data;
  if (payload.event === CONNECTION_STATE_CHANGE) {
    const connectionState = payload.data.connectionState
    if (connectionState === "Connected") {
        logger.log("Connected to AWS IoT");
        // Publish user to IoT
        publishUserToIoT(currentUsername).then(() => {
            console.log('User published successfully');
        }).catch((error) => {
            console.error('Error publishing user:', error);
        });
    }
    console.log(connectionState);
  }
});

async function initializePubSub() {
  try {



    // 1. Verify authentication
    const { credentials, identityId } = await fetchAuthSession();

    logger.log("Credentials:", identityId); // 🛠️
    if(!credentials) throw new Error('No credentials found');

    // 2. Initialize PubSub
    pubsub = new PubSub({
      region: 'us-east-1',
      endpoint: 'wss://a2yqm0wer1ijho-ats.iot.us-east-1.amazonaws.com/mqtt',
      provider: 'AWSIoTProvider',
    });



    // 3. Subscribe first to avoid missing messages
     await subscribeToIoTTopic();
    console.log("subscription active");


    pubsub.publish({
      topics: 'trivia',
      message:  {msg: 'Hello to all subscribers!'},
      options: {provider: 'AWSIoTProvider'}
    }).then( data => {
        console.log('Message published:', data); // 🛠️
    }).catch( error => {
        console.error('Publish error:', error); // 🛠️
    } );

    // 4. Publish presence
    //await publishUserToIoT("kiquetal");

  } catch(error) {
    console.error('PubSub Init Error:', error);
    throw error; // Re-throw to handle in caller
  }
}

async function addUserToWaitingList() {
  cleanup(); // Clear previous connections

  const username = prompt("Please enter your username:");
  if(!username) return;

  currentUsername = username;

  // UI Setup
  const waitingListContent = document.querySelector('#waiting-list-content');
  waitingListContent.innerHTML = '';

  // Mock users
  ['Alice', 'Bob', 'Charlie', 'Diana'].forEach(user => {
    if(user !== currentUsername) {
      waitingListContent.innerHTML += `
        <div class="user-entry">
          <p>User: ${user}</p>
          <button class="challenge-btn" onclick="window.challengeUser('${user}')">
            Challenge
          </button>
        </div>`;
    }
  });

  // Current user
  waitingListContent.innerHTML += `
    <div class="user-entry current-user">
      <p>User: ${currentUsername} (You)</p>
    </div>`;

  // Initialize PubSub
  try {
    await initializePubSub();
    console.log('PubSub active');
  } catch(error) {
    alert('Connection failed. Please refresh.');
    console.error('Final error:', error);
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

          logger.log( 'Received message:', data); // 🛠️
        },
        error: (error) => {
          logger.error('Subscription error:', error); // 🛠️
        },
        complete: () => {
          logger.log('Subscription completed'); // 🛠️
        }
      } );

    resolve();
  });
}


// New: Dynamic UI updates from messages
function addUserToUI(username) {
  const existingUser = document.querySelector(`[data-username="${username}"]`);
  if(existingUser) return;

  const waitingListContent = document.querySelector('#waiting-list-content');
  waitingListContent.innerHTML += `
    <div class="user-entry" data-username="${username}">
      <p>User: ${username}</p>
      <button class="challenge-btn" onclick="window.challengeUser('${username}')">
        Challenge
      </button>
    </div>`;
}

// Updated publish function
async function publishUserToIoT(username) {
  try {

    await pubsub.publish({
      topics:'trivia',
        message: {msg: username},
    });
  } catch(error) {
    console.error('Publish error:', error);
    throw error;
  }
}

// Initialize
document.querySelector('#app').innerHTML = `
  <div>
    <div id="waiting-list">
      <h2>Waiting List</h2>
      <div id="waiting-list-content"></div>
    </div>
  </div>
`;

window.challengeUser = (username) => {
  alert(`Challenging ${username} to a game!`);
};

addUserToWaitingList();
