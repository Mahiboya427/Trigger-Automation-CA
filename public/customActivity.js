window.onload = function () {
  const connection = new Postmonger.Session();
  let payload = {};

  connection.trigger('ready');
  connection.trigger('requestTokens');
  connection.trigger('requestEndpoints');

  connection.on('initActivity', function (data) {
    if (data) {
      payload = data;
    }

    const inArgs = payload?.arguments?.execute?.inArguments || [];

    let email = '';
    inArgs.forEach(arg => {
      if (arg.email) {
        email = arg.email;
      }
    });

    if (email) {
      document.getElementById('emailDisplay').innerText = `Email: ${email}`;
    }
  });

  connection.on('clickedNext', function () {
    const email = '{{Contact.Default.Email}}'; // Use dynamic data binding

    // Update the payload
    payload.arguments.execute.inArguments = [
      { email: email }
    ];
    payload.metaData.isConfigured = true;

    connection.trigger('updateActivity', payload);
  });
};
