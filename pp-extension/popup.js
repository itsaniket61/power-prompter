// Make staticPrompts globally accessible
let staticPrompts = {
  Communication: [
    {
      label: 'Write Email (Formal)',
      prompt:
        "Write a formal and polite email to ${recipient:input} about ${purpose:textarea}. Make sure the tone is ${tone:[respectful, professional, neutral]} Include a clear ${call_to_action:bool} if needed, and end with an appropriate closing such as 'Best regards' or 'Sincerely'.",
    },
  ],
  General: [
    {
      label: 'Summarize',
      prompt: 'Summarize the following text: ${text:textarea}',
    },
    {
      label: 'Translate',
      prompt:
        'Translate the following text to ${language:[English, Spanish, French]}: ${text:textarea}',
    },
  ],
};

document
  .getElementById('prompt-select')
  .addEventListener('change', updateVariableFields);

function updateVariableFields() {
  let selectedPrompt = document.getElementById('prompt-select').value;
  console.log('Prompt selected:', selectedPrompt);

  const variableMatches = selectedPrompt.match(/\${([^}]+)}/g) || [];
  const variables = variableMatches.map((match) => {
    const content = match.slice(2, -1);
    const [name, typeDef] = content.split(':');
    let type = 'input';
    let options = [];

    if (typeDef) {
      if (typeDef.startsWith('[')) {
        type = 'dropdown';
        options = typeDef
          .slice(1, -1)
          .split(',')
          .map((opt) => opt.trim());
      } else if (typeDef.startsWith('{')) {
        type = 'multiselect';
        options = typeDef
          .slice(1, -1)
          .split(',')
          .map((opt) => opt.trim());
      } else if (typeDef === 'bool') {
        type = 'boolean';
      } else if (typeDef === 'input') {
        type = 'input';
      } else if (typeDef === 'textarea') {
        type = 'textarea';
      }
    }

    return { name, type, options };
  });

  const variableContainer = document.getElementById('variable-container');
  variableContainer.innerHTML = '';

  variables.forEach((variable) => {
    const { name, type, options } = variable;
    const label = document.createElement('label');
    label.textContent = `${name}: `;
    label.htmlFor = `var-${name}`;
    variableContainer.appendChild(label);

    if (type === 'dropdown') {
      const select = document.createElement('select');
      select.id = `var-${name}`;
      options.forEach((option) => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
      });
      variableContainer.appendChild(select);
    } else if (type === 'multiselect') {
      const select = document.createElement('select');
      select.id = `var-${name}`;
      select.multiple = true;
      options.forEach((option) => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
      });
      variableContainer.appendChild(select);
    } else if (type === 'boolean') {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `var-${name}`;
      variableContainer.appendChild(checkbox);
    } else if (type === 'textarea') {
      const textarea = document.createElement('textarea');
      textarea.id = `var-${name}`;
      textarea.placeholder = `Enter value for ${name}`;
      textarea.rows = 4;
      variableContainer.appendChild(textarea);
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.id = `var-${name}`;
      input.placeholder = `Enter value for ${name}`;
      variableContainer.appendChild(input);
    }

    variableContainer.appendChild(document.createElement('br'));
  });
}

function updateMostlyUsed(category, promptLabel) {
  const mostlyUsed = JSON.parse(
    localStorage.getItem('mostlyUsedPrompts') || '{}'
  );
  const key = `${category}:${promptLabel}`;
  mostlyUsed[key] = { count: (mostlyUsed[key]?.count || 0) + 1 };
  localStorage.setItem('mostlyUsedPrompts', JSON.stringify(mostlyUsed));

  const mostlyUsedPills = document.getElementById('mostly-used-pills');
  mostlyUsedPills.innerHTML = '';

  const sortedPrompts = Object.entries(mostlyUsed)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 4);

  sortedPrompts.forEach(([key]) => {
    const [cat, label] = key.split(':');
    const pill = document.createElement('span');
    pill.textContent = label;
    pill.className = 'mostly-used-pill'; // Single class for styling

    const removeButton = document.createElement('button');
    removeButton.textContent = 'x';
    removeButton.className = 'remove-pill';
    removeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      delete mostlyUsed[key];
      localStorage.setItem('mostlyUsedPrompts', JSON.stringify(mostlyUsed));
      updateMostlyUsed(category, promptLabel);
    });

    pill.appendChild(removeButton);

    pill.addEventListener('click', () => {
      const categoriesSelect = document.getElementById('prompts-categories');
      const promptSelect = document.getElementById('prompt-select');
      categoriesSelect.value = cat;

      promptSelect.innerHTML = '';
      staticPrompts[cat].forEach((staticPrompt) => {
        const option = document.createElement('option');
        option.value = staticPrompt.prompt;
        option.textContent = staticPrompt.label;
        promptSelect.appendChild(option);
      });
      promptSelect.value = staticPrompts[cat].find(
        (p) => p.label === label
      ).prompt;
      updateVariableFields();
    });

    mostlyUsedPills.appendChild(pill);
  });
}

document.getElementById('insert-btn').addEventListener('click', () => {
  let selectedPrompt = document.getElementById('prompt-select').value;
  const selectedLabel =
    document.getElementById('prompt-select').selectedOptions[0].text;
  const selectedCategory = document.getElementById('prompts-categories').value;
  const variableInputs = document.querySelectorAll(
    '#variable-container select, #variable-container input, #variable-container textarea'
  );

  variableInputs.forEach((input) => {
    const variableName = input.id.replace('var-', '');
    let variableValue;

    if (input.tagName === 'SELECT') {
      if (input.multiple) {
        variableValue = Array.from(input.selectedOptions)
          .map((opt) => opt.value)
          .join(', ');
      } else {
        variableValue = input.value;
      }
    } else if (input.type === 'checkbox') {
      variableValue = input.checked.toString();
    } else {
      variableValue = input.value;
    }

    console.log(
      `Replacing variable: ${variableName} with value: ${variableValue}`
    );
    const variablePlaceholder = new RegExp(
      `\\\${${variableName}(:[^}]*)?}`,
      'g'
    );
    selectedPrompt = selectedPrompt.replace(variablePlaceholder, variableValue);
  });

  const finalPrompt = `${selectedPrompt}`;
  console.log('Final prompt to be inserted:', finalPrompt);

  updateMostlyUsed(selectedCategory, selectedLabel);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const allowedHost = ['chat.openai.com', 'chatgpt.com'];
    const currentTab = tabs[0];
    const url = new URL(currentTab.url);
    if (allowedHost.includes(url.hostname)) {
      console.log('Allowed host detected:', url.hostname);
      chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        function: insertPrompt,
        args: [finalPrompt],
      });
    } else {
      console.warn(
        'This feature is not available for this website:',
        url.hostname
      );
      alert('This feature is not available for this website.');
    }
  });
});

function insertPrompt(finalPrompt) {
  const textarea = document.querySelector('#prompt-textarea');
  if (textarea) {
    console.log('Inserting prompt into textarea');
    textarea.innerHTML = finalPrompt;
    textarea.focus();
    setTimeout(() => {
      const sendButton = document.querySelector('[data-testid="send-button"]');
      if (sendButton) {
        console.log('Send button found, clicking to send prompt');
        sendButton.click();
      } else {
        console.error('Could not find the send button.');
        alert('Could not find the send button.');
      }
    }, 1000);
  } else {
    console.error("Could not find ChatGPT's input field.");
    alert("Could not find ChatGPT's input field.");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('prompt-select');
  const categoriesSelect = document.getElementById('prompts-categories');
  console.log('Document loaded, initializing prompt selection');

  const updateCategoriesAndPrompts = (prompts) => {
    categoriesSelect.innerHTML = '';
    Object.keys(prompts).forEach((category) => {
      console.log(`Adding Category`, category);
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoriesSelect.appendChild(option);
    });

    categoriesSelect.addEventListener('change', () => {
      const category = categoriesSelect.value;
      select.innerHTML = '';
      prompts[category].forEach((staticPrompt) => {
        const option = document.createElement('option');
        option.value = staticPrompt.prompt;
        option.textContent = staticPrompt.label;
        select.appendChild(option);
      });
      updateVariableFields();
    });

    categoriesSelect.value = Object.keys(prompts)[0] || '';
    if (categoriesSelect.value) {
      select.innerHTML = '';
      prompts[categoriesSelect.value].forEach((staticPrompt) => {
        const option = document.createElement('option');
        option.value = staticPrompt.prompt;
        option.textContent = staticPrompt.label;
        select.appendChild(option);
      });
      updateVariableFields();
    }

    const mostlyUsed = JSON.parse(
      localStorage.getItem('mostlyUsedPrompts') || '{}'
    );
    const mostlyUsedPills = document.getElementById('mostly-used-pills');
    mostlyUsedPills.innerHTML = ''; // Clear existing pills before adding new ones
    const sortedPrompts = Object.entries(mostlyUsed)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 4);

    sortedPrompts.forEach(([key]) => {
      const [cat, label] = key.split(':');
      const pill = document.createElement('span');
      pill.textContent = label;
      pill.className = 'mostly-used-pill'; // Single class for styling

      const removeButton = document.createElement('button');
      removeButton.textContent = '✖';
      removeButton.className = 'remove-pill';
      removeButton.addEventListener('click', (event) => {
        event.stopPropagation();
        delete mostlyUsed[key];
        localStorage.setItem('mostlyUsedPrompts', JSON.stringify(mostlyUsed));
        updateMostlyUsed(cat, label);
      });

      pill.appendChild(removeButton);

      pill.addEventListener('click', () => {
        categoriesSelect.value = cat;
        select.innerHTML = '';
        staticPrompts[cat].forEach((staticPrompt) => {
          const option = document.createElement('option');
          option.value = staticPrompt.prompt;
          option.textContent = staticPrompt.label;
          select.appendChild(option);
        });
        select.value = staticPrompts[cat].find((p) => p.label === label).prompt;
        updateVariableFields();
      });

      mostlyUsedPills.appendChild(pill);
    });
  };

  console.log('Static prompts added:', staticPrompts);
  updateCategoriesAndPrompts(staticPrompts);

  let index = 1;
  function fetchPrompt() {
    const host = 'https://itsaniket61.github.io/power-prompter/prompts';
    console.log('Fetching prompts from:', `${host}/${index}.json`);

    fetch(`${host}/${index}.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('No more prompts found');
        }
        return response.json();
      })
      .then((data) => {
        Object.keys(data).forEach((category) => {
          if (staticPrompts[category]) {
            staticPrompts[category] = [...data[category]];
          } else {
            staticPrompts[category] = data[category];
          }
        });
        index++;
        updateCategoriesAndPrompts(staticPrompts);
        fetchPrompt();
      })
      .catch((error) => {
        if (index === 1) {
          console.error('Error fetching prompts:', error);
        }
      });
  }

  fetchPrompt();
});
