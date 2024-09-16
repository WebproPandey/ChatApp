const socket = io();
let username = '';

document.getElementById('join-btn').addEventListener('click', () => {
  username = document.getElementById('username').value;
  const room = document.getElementById('room').value;
  socket.emit('joinRoom', { username, room });
});

document.getElementById('send-btn').addEventListener('click', sendMessage);

document.getElementById('message').addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    sendMessage();
  } else {
    socket.emit('typing', username);
  }
});

document.getElementById('message').addEventListener('keyup', () => {
  setTimeout(() => {
    socket.emit('stopTyping', username);
  }, 1000);
});

document.getElementById('file-input').addEventListener('change', (event) => {
  const file = event.target.files[0];
  const formData = new FormData();
  formData.append('file', file);

  fetch('/upload', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    socket.emit('chatMessage', { username, message: `<a href="${data.filePath}" target="_blank">File</a>` });
  });
});

socket.on('message', (data) => {
  const messageClass = data.username === username ? 'message left' : 'message right';
  const messageContent = data.username === username ? data.message : `<strong>${data.username}:</strong> ${data.message}`;
  const messageElement = `
    <div class="${messageClass}">
      ${messageContent}
      <span class="timestamp">${new Date().toLocaleTimeString()}</span>
    </div>`;
  document.getElementById('output').insertAdjacentHTML('beforeend', messageElement);
  scrollToBottom();
});

socket.on('joinNotification', (message) => {
  document.getElementById('feedback').innerHTML = `<p>${message}</p>`;
});

socket.on('typing', (username) => {
  document.getElementById('feedback').innerHTML = ''; // Clear join notification
  document.getElementById('feedback').innerHTML = `<p>${username} is typing...</p>`;
});

socket.on('stopTyping', () => {
  document.getElementById('feedback').innerHTML = '';
});

function sendMessage() {
  const message = document.getElementById('message').value;
  if (message.trim() !== '') {
    socket.emit('chatMessage', { username, message });
    document.getElementById('message').value = '';
    socket.emit('stopTyping', username); // Stop typing notification when message is sent
  }
}

function scrollToBottom() {
  const chatWindow = document.getElementById('chat-window');
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
