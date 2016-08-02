# Node-spotify-viewer

View current playing song on Spotify.

- Local (local.js) node instance get track id using Spotify WebHelper
- Local instance sends track id using websocket to a server (app.js)
- Server calls Spotify web api to get track name, artist and artwork
- Server sends data to client served by app.js.

## Inspiration: 
- https://github.com/nadavbar/node-spotify-webhelper
- http://cgbystrom.com/articles/deconstructing-spotifys-builtin-http-server/