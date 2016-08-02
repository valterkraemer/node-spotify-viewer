var request = require('request');
var fs = require('fs');

var http = require('http');
var server = require('http').createServer();

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
  server: server
});

var PORT = process.env.PORT || 3000;

var latestTrackInfo;

wss.on('connection', function connection(ws) {
  console.log('connection');

  if (latestTrackInfo) {
    ws.send(latestTrackInfo);
  }

  ws.on('message', function incoming(message) {

    var data = {};

    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('JSON error', message);
    }

    switch(data.type) {
      case 'status':
        return setTrackInfo(data)
        .then(function() {
          return broadcast(latestTrackInfo);
        });
      default:
        return broadcast(message);
    }
  });
});

server.on('request', function(req, res) {

  fs.readFile('./index.html', function(error, content) {
    
    res.writeHead(200, {
      'Content-Type': 'text/html'
    });
    res.end(content, 'utf-8');
  });

}).listen(PORT, function () {
  console.log('Listening on ' + server.address().port);
});

var trackId = '';

function setTrackInfo(data) {
  return new Promise(function (resolve, reject) {

    if (data.trackId === trackId) {
      latestTrackInfo.playing = data.playing;
      return resolve();
    }

    request({
      'url': 'https://api.spotify.com/v1/tracks/' + data.trackId,
    }, function (err, req, body) {
      if (err) {
        return reject(err);
      }

      var parsedBody = JSON.parse(body);

      latestTrackInfo = JSON.stringify({
        type: 'status',
        data: {
          artist: parsedBody.artists[0].name,
          track: parsedBody.name,
          image: parsedBody.album.images[0].url,
          playing: data.playing
        }
      });

      return resolve();
    });
  });
}

function broadcast(string) {
  wss.clients.forEach(function each(client) {
    client.send(string);
  });

  return Promise.resolve();
}
