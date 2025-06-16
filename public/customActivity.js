window.onload = function () {
  const connection = new Postmonger.Session();
  let payload = {};

  connection.trigger('ready');
  connection.trigger('requestTokens');
  connection.trigger('requestEndpoints');

  connection.on('initActivity', function (data) {
    if (data) payload = data;

    const hasInArguments =
      payload.arguments &&
      payload.arguments.execute &&
      payload.arguments.execute.inArguments &&
      payload.arguments.execute.inArguments.length > 0;

    if (hasInArguments) {
      const inArgs = payload.arguments.execute.inArguments;
      inArgs.forEach(arg => {
        if (arg.automationKey) {
          document.getElementById('automationKey').value = arg.automationKey;
        }
      });
    }
  });

  document.getElementById('done').addEventListener('click', function () {
    const automationKey = document.getElementById('automationKey').value.trim();

    if (!automationKey) {
      alert('Please enter a valid Automation Key.');
      return;
    }

    payload.arguments.execute.inArguments = [
      { automationKey: automationKey },
      { email: '{{Contact.Default.Email}}' } // optional
    ];

    payload.metaData.isConfigured = true;

    // ✅ Wait for updateActivity to complete before moving to nextStep
    connection.trigger('updateActivity', payload);
    setTimeout(() => {
      connection.trigger('nextStep');
    }, 300); // slight delay ensures config is saved before modal closes
  });
};
