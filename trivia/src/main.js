import './style.css'
import './waitingList.css'
import { Amplify} from "aws-amplify";
import { fetchAuthSession } from 'aws-amplify/auth';

import amplify_outputs from "../amplify_outputs.json";

Amplify.configure(amplify_outputs)

let currentUsername = '';

async function addUserToWaitingList() {
  const username = prompt("Please enter your username:");
  if (username) {
    currentUsername = username;
    const waitingListContent = document.querySelector('#waiting-list-content');
    waitingListContent.innerHTML = ''; // Clear existing content

    // Add some mock users for demonstration
    const users = ['Alice', 'Bob', 'Charlie', 'Diana'];
    users.forEach(user => {
      if (user !== currentUsername) {
        waitingListContent.innerHTML += `
          <div class="user-entry">
            <p>User: ${user}</p>
            <button class="challenge-btn" onclick="window.challengeUser('${user}')">Challenge</button>
          </div>
        `;
      }
    });

    // Add current user
    waitingListContent.innerHTML += `
      <div class="user-entry current-user">
        <p>User: ${currentUsername} (You)</p>
      </div>
    `;

    // print the credentials used by amplify
    try {
      const credentials = await fetchAuthSession();
      console.log("Credentials used by Amplify:", credentials);
    } catch (error) {
      console.error("Error fetching auth session:", error);
    }
  }
}

// Add challenge function to window object
window.challengeUser = (username) => {
  alert(`Challenging ${username} to a game!`);
  // Here you would implement the actual challenge logic
};

document.querySelector('#app').innerHTML = `
  <div>
    <div id="waiting-list">
      <h2>Waiting List</h2>
      <div id="waiting-list-content"></div>
    </div>
  </div>
`;


// Initialize the waiting list
addUserToWaitingList();
