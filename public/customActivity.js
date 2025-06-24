// customActivity.js
document.addEventListener('DOMContentLoaded', function () {
  const connection = new Postmonger.Session();
  let payload = {};
  window.selectedKey = null;

  console.log("✅ JS loaded and DOM ready");

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

  document.getElementById('done').addEventListener('click', function () {
    const selectedKey = window.selectedKey;
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

    connection.trigger('updateActivity', payload);
  });

  // Fetch list of automations
  fetch('/automations')
    .then(response => response.json())
    .then(data => {
      console.log("✅ Fetched automations:", data); // ✅ See if this logs
      const automationList = document.getElementById('automationList');
      if (!automationList) return;

      automationList.innerHTML = '';

      (data.items || []).forEach(item => {
        if (item.status === 'Running') return;

        const card = document.createElement('div');
        card.className = 'automation-card';
        card.innerHTML = `
          <strong>Key: ${item.key}</strong>
          <div class="status ${item.status}">${item.status}</div>
          <div class="automation-key">${item.name}</div>
          <div class="automation-run">Last Run: ${new Date(item.lastRunTime).toLocaleString()}</div>
          <button class="use-key-btn" style="background-color: #007bff; color: white; padding: 6px 10px; margin-top: 10px; border: none; border-radius: 4px;">Confirm</button>
        `;

        card.querySelector('.use-key-btn').addEventListener('click', () => {
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
      console.error('❌ Error fetching automations:', err);
      const automationList = document.getElementById('automationList');
      if (automationList) automationList.innerHTML = '<p>Error loading automations.</p>';
    });

  // Manual entry fallback
  document.getElementById('manualKey')?.addEventListener('input', function (e) {
    window.selectedKey = e.target.value.trim();
    document.querySelectorAll('.automation-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('status').innerText = window.selectedKey ? `Entered: ${window.selectedKey}` : '';
  });
});
