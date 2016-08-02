var request = require('request');

var WebSocket = require('ws');
var ws = new WebSocket('ws://localhost:3000');

var headers = {
  'Origin': 'https://open.spotify.com'
};

function getCsrfToken() {

  var params = {
    'url': 'https://asdfasdfas.spotilocal.com:4370/simplecsrf/token.json',
    'headers': headers,
    'rejectUnauthorized' : false
  };

  return new Promise(function(resolve, reject) {
    request(params, function (err, req, body) {
      if (err) {
        return reject(err);
      }
      var parsedBody = JSON.parse(body);
      return resolve(parsedBody.token);
    });
  });
}

function getOauthToken() {

  var params = {
    'url': 'http://open.spotify.com/token',
    'headers': headers,
    'rejectUnauthorized' : false
  };

  return new Promise(function(resolve, reject) {
    request(params, function (err, req, body) {
      if (err) {
        return reject(err);
      }
      var parsedBody = JSON.parse(body);
      return resolve(parsedBody.t);
    });
  });
}

function connect(values) {
  var csrf = values[0];
  var oauth = values[1];

  var url = 'https://asdfasdfas.spotilocal.com:4370/remote/status.json' + 
  '?oauth=' + oauth + '&csrf=' + csrf +
  '&returnon=play%2Cpause&returnafter=60';

  var params = {
    'url': url,
    'headers': headers,
    'rejectUnauthorized' : false
  };

  function getTrackId() {
    request(params, function (err, req, body) {
      if (err) {
        return reject(err);
      }
      var parsedBody = JSON.parse(body);
      var trackId = parsedBody.track.track_resource.uri.split('spotify:track:')[1];
      sendTrackId(trackId);
      getTrackId();
    });
  }

  getTrackId();
}

var trackId = '';

function sendTrackId(newTrackId) {
  console.log('newTrackId', newTrackId);

  if (newTrackId === trackId) {
    return;
  }

  trackId = newTrackId;

  ws.send('post:' + trackId);
}



Promise.all([
  getCsrfToken(),
  getOauthToken()
  ])
.then(connect);
