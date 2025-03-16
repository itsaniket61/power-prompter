document.getElementById('insert-btn').addEventListener('click', () => {
  const selectedPrompt = document.getElementById('prompt-select').value;
  const userInput = document.getElementById('user-input').value;

  const finalPrompt = `${selectedPrompt}${userInput}`;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: insertPrompt,
      args: [finalPrompt],
    });
  });
});

function insertPrompt(finalPrompt) {
  const textarea = document.querySelector('#prompt-textarea');
  if (textarea) {
    textarea.innerHTML = finalPrompt;
    textarea.focus();
    setTimeout(() => {
      const sendButton = document.querySelector('[data-testid="send-button"]');
      if (sendButton) {
        sendButton.click();
      } else {
        alert("Could not find the send button.");
      }
    }, 1000);
  } else {
    alert("Could not find ChatGPT's input field.");
  }
}
