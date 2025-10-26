document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['researchNotes'], function(result) {
    if (result.researchNotes) {
      document.getElementById('notes').value = result.researchNotes;
    }
  });

  document.getElementById('summarizeBtn').addEventListener('click', summarizeText);
  document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);
});

async function summarizeText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => window.getSelection().toString()
    });

    if (!result) {
      showResult('⚠️ Please select some text first.');
      return;
    }

    const response = await fetch('http://localhost:8080/api/research/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: result, operation: 'summarize' })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const text = await response.text();
    showResult(text.replace(/\n/g, '<br>'));
  } catch (error) {
    showResult('❌ ' + error.message);
  }
}

function saveNotes() {
  const notes = document.getElementById('notes').value.trim();
  if (!notes) return alert('Please write something first.');

  chrome.storage.local.set({ 'researchNotes': notes }, () => {
    const btn = document.getElementById('saveNotesBtn');
    btn.textContent = 'Saved!';
    setTimeout(() => (btn.textContent = 'Save Notes'), 1200);
  });
}

function showResult(content) {
  const resultsDiv = document.getElementById('results');
  const div = document.createElement('div');
  div.className = 'result-item';
  div.innerHTML = `<div class="result-content">${content}</div>`;
  resultsDiv.prepend(div);
}
