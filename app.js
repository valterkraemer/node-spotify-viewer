var request = require('request');
var fs = require('fs');

var http = require('http');
var server = require('http').createServer();

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
  server: server
});

var PORT = process.env.PORT || 3000;

var latestTrackInfo = '';

wss.on('connection', function connection(ws) {

  console.log('connection');

  ws.send(latestTrackInfo);

  ws.on('message', function incoming(message) {
    var data = message.split(':');
    var key = data[0];
    var value = data[1];

    switch(key) {
      case 'post':
        getTrackInfo(value);
        break;
    }
  });
});

server.on('request', function(req, res) {

  fs.readFile('./index.html', function(error, content) {

    console.log('Request');
    res.writeHead(200, {
      'Content-Type': 'text/html'
    });
    res.end(content, 'utf-8');

  });
}).listen(PORT, function () {
  console.log('Listening on ' + server.address().port);
});

function getTrackInfo(trackId) {

  request({
    'url': 'https://api.spotify.com/v1/tracks/' + trackId,
  }, function (err, req, body) {

    if (err) {
      return console.error('err', err);
    }

    var parsedBody = JSON.parse(body);

    latestTrackInfo = JSON.stringify({
      artist: parsedBody.artists[0].name,
      track: parsedBody.name,
      image: parsedBody.album.images[0].url
    });

    wss.clients.forEach(function each(client) {
      client.send(latestTrackInfo);
    });
  });
}