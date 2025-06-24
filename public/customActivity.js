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

  // ✅ Use Journey Builder's native 'Done' button
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
      { automationKey: selectedKey },
      { email: '{{InteractionDefaults.Email}}' }
    ];

    payload.metaData.isConfigured = true;
    payload.metaData.label = "Automation: " + selectedKey;

    connection.trigger('updateActivity', payload);
  });

  // 🔁 Fetch automation list
  fetch('/automations')
    .then(response => response.json())
    .then(data => {
      const automationList = document.getElementById('automationList');
      automationList.innerHTML = '';

      data.items.forEach(item => {
        if (item.status === 'Running') return; // skip running automations

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
};
