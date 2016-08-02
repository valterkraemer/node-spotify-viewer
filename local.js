var request = require('request');

var WebSocket = require('ws');
var wsUrl = 'ws://' + (process.argv[2] || 'localhost:3000');
var ws = new WebSocket(wsUrl);

console.log('Connection to WebSocket at "' + wsUrl + '"');

var headers = {
  'Origin': 'https://open.spotify.com'
};

var csrf = '';
var oauth = '';

ws.on('message', function(message) {

  var data = {};

  try {
    data = JSON.parse(message);
  } catch (e) {
    console.error('JSON error', message);
  }

  console.log('data', data);

  switch (data.type) {
    case 'play':
      return play();
    case 'pause':
      return pause();
  }
});

function getCsrfToken() {

  var url = 'https://randomtext.spotilocal.com:4370/simplecsrf/token.json';

  return spotilocalReq(url)
  .then(function(data) {
    return data.token;
  });
}

function getOauthToken() {

  var url = 'http://open.spotify.com/token';

  return spotilocalReq(url)
  .then(function(data) {
    return data.t;
  });
}

function connect(values) {
  csrf = values[0];
  oauth = values[1];

  var getOnceUrl = 'https://randomtext.spotilocal.com:4370/remote/status.json' + 
  '?oauth=' + oauth + '&csrf=' + csrf;

  var watchUrl = getOnceUrl + '&returnon=play%2Cpause&returnafter=60';

  function getStatus() {
    return spotilocalReq(watchUrl)
    .then(sendData)
    .then(getStatus);
  }

  spotilocalReq(getOnceUrl)
  .then(sendData)
  .then(getStatus)
  .catch(function(err) {
    console.error('err', err);
  });
}

function sendData(data) {

  var socketData = JSON.stringify({
    type: 'status',
    trackId: data.track.track_resource.uri.split('spotify:track:')[1],
    playing: data.playing
  });

  return new Promise(function(resolve, reject) {
    ws.send(socketData, function(err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
  
}

function spotilocalReq(url, next) {
  var params = {
    'url': url,
    'headers': {
      'Origin': 'https://open.spotify.com'
    },
    'rejectUnauthorized' : false
  };

  return new Promise(function(resolve, reject) {
    request(params, function (err, req, body) {
      if (err) {
        return reject(err);
      }
      return resolve(JSON.parse(body));
    });
  });
}

function pause() {
  var url = 'https://randomtext.spotilocal.com:4370/remote/pause.json' + 
  '?oauth=' + oauth + '&csrf=' + csrf +
  '&pause=true';

  spotilocalReq(url);
}

function play() {
  var url = 'https://randomtext.spotilocal.com:4370/remote/pause.json' + 
  '?oauth=' + oauth + '&csrf=' + csrf +
  '&pause=false';

  spotilocalReq(url);
}

Promise.all([
  getCsrfToken(),
  getOauthToken()
  ])
.then(connect);
