window.onload = function () {
  const connection = new Postmonger.Session();
  let payload = {};

  connection.trigger('ready');

  connection.on('initActivity', function (data) {
    if (data) {
      payload = data;
    }
  });

  document.getElementById('done').addEventListener('click', function () {
    connection.trigger('updateActivity', payload);
  });
};
