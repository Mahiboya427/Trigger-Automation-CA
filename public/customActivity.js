define(['postmonger'], function (Postmonger) {
  'use strict';

  const connection = new Postmonger.Session();
  let payload = {};
  let eventDefinitionKey = null;

  // Trigger initial requests when window is ready
  $(window).ready(function () {
    connection.trigger('ready');
    connection.trigger('requestTokens');
    connection.trigger('requestEndpoints');
    connection.trigger('requestInteraction');
  });

  // Called when the activity is initialized in the Journey Builder UI
  connection.on('initActivity', function (data) {
    if (data) {
      payload = data;
    }

    const inArguments = payload.arguments?.execute?.inArguments || [];

    // Pre-fill values if editing an existing configured activity
    inArguments.forEach(arg => {
      if (arg.messageBody) {
        $('#messageBody').val(arg.messageBody);
      }
      if (arg.messagingService) {
        $('#messagingService').val(arg.messagingService);
      }
      if (arg.accountSid) {
        $('#accountSid').val(arg.accountSid);
      }
      if (arg.authToken) {
        $('#authToken').val(arg.authToken);
      }
    });

    // Ensure Journey Builder knows this is configured (will update again after click)
    payload.metaData = payload.metaData || {};
    payload.metaData.isConfigured = true;

    connection.trigger('updateButton', {
      button: 'next',
      visible: true,
      text: 'Done'
    });
  });

  // Handle when user clicks the “Next” or “Done” button
  connection.on('clickedNext', function () {
    const messageBody = $('#messageBody').val();
    const messagingService = $('#messagingService').val();
    const accountSid = $('#accountSid').val();
    const authToken = $('#authToken').val();

    // Optional: validate required fields before saving
    if (!messageBody || !messagingService || !accountSid || !authToken) {
      alert('All fields are required.');
      return;
    }

    // Build inArguments with Journey data and user input
    payload.arguments = payload.arguments || {};
    payload.arguments.execute = payload.arguments.execute || {};
    payload.arguments.execute.inArguments = [
      {
        messageBody: messageBody,
        messagingService: messagingService,
        accountSid: accountSid,
        authToken: authToken,
        to: '{{Contact.Attribute.SMS.phonenumber}}', // Replace as needed
        eventDefinitionKey: eventDefinitionKey
      }
    ];

    payload.metaData.isConfigured = true;

    console.log("🔁 Submitting updated payload to Journey Builder:");
    console.log(JSON.stringify(payload, null, 2));

    connection.trigger('updateActivity', payload);
  });

  // Store the eventDefinitionKey for use in inArguments (if needed)
  connection.on('requestedInteraction', function (interaction) {
    if (interaction) {
      eventDefinitionKey = interaction.eventDefinitionKey;
    }
  });
});
