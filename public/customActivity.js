define(['postmonger'], function (Postmonger) {
  'use strict';

  const connection = new Postmonger.Session();
  let payload = {};

  // When window is ready
  $(window).ready(function () {
    connection.trigger('ready');
    connection.trigger('requestTokens');
    connection.trigger('requestEndpoints');
  });

  // When Journey loads the activity
  connection.on('initActivity', function (data) {
    if (data) {
      payload = data;
    }

    // Mark activity as configured
    payload['metaData'] = payload['metaData'] || {};
    payload['metaData'].isConfigured = true;

    connection.trigger('updateButton', {
      button: 'next',
      visible: true,
      text: 'Done'
    });
  });

  // When “Done” is clicked in UI
  connection.on('clickedNext', function () {
    // No need to set inArguments if you're just triggering an API
    connection.trigger('updateActivity', payload);
  });
});
