// customActivity.js
window.onload = function () {
  const connection = new Postmonger.Session();
  let payload = {};
  window.selectedKey = null;

  connection.trigger('ready');
  connection.trigger('requestTokens');
  connection.trigger('requestEndpoints');

  connection.on('initActivity', function (data) {
    if (data) {
      payload = data;
    }

    const inArgs = payload?.arguments?.execute?.inArguments ?? [];

    inArgs.forEach(arg => {
      if (arg.automationKey) {
        window.selectedKey = arg.automationKey;
        document.getElementById('manualKey').value = arg.automationKey;
        document.getElementById('status').innerText = `Previously selected: ${arg.automationKey}`;
      }
    });
  });

  // ✅ Triggered when user clicks "Done"
  connection.on('clickedNext', function () {
    const manualKey = document.getElementById('manualKey').value.trim();
    const selectedKey = manualKey || window.selectedKey;

    if (!selectedKey) {
      alert('Please select or enter a valid Automation Key.');
      return;
    }

    payload.arguments = payload.arguments || {};
    payload.arguments.execute = payload.arguments.execute || {};
    payload.arguments.execute.inArguments = [
      { automationKey: selectedKey }
    ];

    payload.metaData.isConfigured = true;
    payload.metaData.label = "Automation: " + selectedKey;
    payload.name = "Key: " + selectedKey; // ✅ This updates the Journey canvas label

    connection.trigger('updateActivity', payload);
  });

  // 🔁 Load automations and render UI
  fetch('/automations')
    .then(response => response.json())
    .then(data => {
      const automationList = document.getElementById('automationList');
      automationList.innerHTML = '';

      data.items.forEach(item => {
        if (item.status === 'Running') return;

        const card = document.createElement('div');
        card.className = 'automation-card';
        card.innerHTML = `
          <strong>${item.name}</strong>
          <div class="status ${item.status}">${item.status}</div>
          <div class="automation-key">Key: ${item.key}</div>
          <div class="automation-run">Last Run: ${new Date(item.lastRunTime).toLocaleString()}</div>
        `;

        card.addEventListener('click', () => {
          document.querySelectorAll('.automation-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          window.selectedKey = item.key;
          document.getElementById('manualKey').value = '';
          document.getElementById('status').innerText = `Selected: ${item.key}`;
        });

        automationList.appendChild(card);
      });
    })
    .catch(err => {
      console.error('Error fetching automations:', err);
      document.getElementById('automationList').innerHTML = '<p>Error loading automations.</p>';
    });

  // 🧾 Confirm manual key
  document.querySelector('.manual-entry button')?.addEventListener('click', () => {
    const key = document.getElementById('manualKey').value.trim();
    if (key) {
      document.querySelectorAll('.automation-card').forEach(c => c.classList.remove('selected'));
      window.selectedKey = key;
      document.getElementById('status').innerText = `Entered: ${key}`;
    }
  });
};
