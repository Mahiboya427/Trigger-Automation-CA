window.onload = function () {
  const connection = new Postmonger.Session();
  let payload = {};

  // Ready signal to Journey Builder
  connection.trigger('ready');

  // Load existing payload if returning to configuration
  connection.on('initActivity', function (data) {
    if (data) {
      payload = data;
    }

    // Ensure inArguments exists
    if (!payload.arguments) {
      payload.arguments = {};
    }

    if (!payload.arguments.execute) {
      payload.arguments.execute = {};
    }

    payload.arguments.execute.inArguments = [
      {
        triggerSource: 'journeyBuilder',
        timestamp: new Date().toISOString()
      }
    ];
  });

  // Save configuration when clicking 'Done'
  connection.on('clickedNext', function () {
    connection.trigger('updateActivity', payload);
  });

  // Support legacy 'done' button if present
  const doneBtn = document.getElementById('done');
  if (doneBtn) {
    doneBtn.addEventListener('click', function () {
      connection.trigger('updateActivity', payload);
    });
  }
};
