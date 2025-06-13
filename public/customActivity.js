define(['postmonger'], function (Postmonger) {
  'use strict';

  const connection = new Postmonger.Session();
  let payload = {};
  let eventDefinitionKey = null;

  // On window ready
  $(window).ready(function () {
    connection.trigger('ready');
    connection.trigger('requestTokens');
    connection.trigger('requestEndpoints');
  });

  // Init the activity
  connection.on('initActivity', function (data) {
    if (data) {
      payload = data;
    }

    const inArguments = payload.arguments?.execute?.inArguments || [];

    // Load values if already saved
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

    // Mark activity as configured
    payload.metaData = payload.metaData || {};
    payload.metaData.isConfigured = true;

    // Show the Next/Done button
    connection.trigger('updateButton', {
      button: 'next',
      visible: true,
      text: 'Done'
    });
  });

  // Handle the Next button
  connection.on('clickedNext', function () {
    const messageBody = $('#messageBody').val();
    const messagingService = $('#messagingService').val();
    const accountSid = $('#accountSid').val();
    const authToken = $('#authToken').val();

    // Build inArguments
    payload.arguments.execute.inArguments = [
      {
        messageBody: messageBody,
        messagingService: messagingService,
        accountSid: accountSid,
        authToken: authToken,
        to: "{{Contact.Attribute.SMS.phonenumber}}" // or adapt to your data model
      }
    ];

    // Mark the activity as configured
    payload.metaData.isConfigured = true;

    console.log("Final payload being sent to updateActivity:", JSON.stringify(payload));

    // Send back to Journey Builder
    connection.trigger('updateActivity', payload);
  });

  // Optional: Get eventDefinitionKey
  connection.on('requestedInteraction', function (interaction) {
    if (interaction) {
      eventDefinitionKey = interaction.eventDefinitionKey;
    }
  });
});
