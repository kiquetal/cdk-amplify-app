import './style.css'
import './waitingList.css'

// Add username prompt functionality
function addUserToWaitingList() {
  const username = prompt("Please enter your username:");
  if (username) {
    const waitingListContent = document.querySelector('#waiting-list-content');
    waitingListContent.innerHTML += `<p>User: ${username}</p>`;
  }
}

document.querySelector('#app').innerHTML = `
  <div>
    <div id="waiting-list">
      <h2>Waiting List</h2>
      <div id="waiting-list-content"></div>
    </div>
  </div>
`

// Call function after the DOM elements are created
addUserToWaitingList();
