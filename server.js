// express und http Module importieren. Sie sind dazu da, die HTML-Dateien
// aus dem Ordner "public" zu veröffentlichen.
var express = require('express');
var app = express();
var server = require('http').createServer(app);

// Mit dieser zusätzlichen Zeile bringen wir Socket.io in unseren Server.
var io = require('socket.io')(server);

// Mit diesem Kommando starten wir den Webserver.
var port = process.env.PORT || 3000;
server.listen(port, function () {
// Wir geben einen Hinweis aus, dass der Webserer läuft.
console.log('Webserver läuft und hört auf Port %d', port);
});

// Hier teilen wir express mit, dass die öffentlichen HTML-Dateien
// im Ordner "public" zu finden sind.
app.use(express.static(__dirname + '/public'));

// === Ab hier folgt der Code für den Chat-Server

// Hier sagen wir Socket.io, dass wir informiert werden wollen,
// wenn sich etwas bei den Verbindungen ("connections") zu 
// den Browsern tut. 
io.on('connection', function (socket) {
// Die variable "socket" repräsentiert die aktuelle Web Sockets
// Verbindung zu jeweiligen Browser client.
  
// Kennzeichen, ob der Benutzer sich angemeldet hat 
var addedUser = false;

// Funktion, die darauf reagiert, wenn sich der Benutzer anmeldet
socket.on('add user', function (username) {
// Benutzername wird in der aktuellen Socket-Verbindung gespeichert
socket.username = username;
addedUser = true;
    
// Dem Client wird die "login"-Nachricht geschickt, damit er weiß,
// dass er erfolgreich angemeldet wurde.
socket.emit('login');
    
// Alle Clients informieren, dass ein neuer Benutzer da ist.
socket.broadcast.emit('user joined', socket.username);
});

// Funktion, die darauf reagiert, wenn ein Benutzer eine Nachricht schickt
socket.on('new message', function (data) {
// Sende die Nachricht an alle Clients
socket.broadcast.emit('new message', {
  username: socket.username,
  message: data
});
});

socket.on('update message', function (data) {
  // Sende die Nachricht an alle Clients
  socket.broadcast.emit('update message', {
    username: socket.username,
    message: data
  });
  });

// Funktion, die darauf reagiert, wenn sich ein Benutzer abmeldet.
// Benutzer müssen sich nicht explizit abmelden. "disconnect"
// tritt auch auf wenn der Benutzer den Client einfach schließt.
socket.on('disconnect', function () {
if (addedUser) {
  // Alle über den Abgang des Benutzers informieren
  socket.broadcast.emit('user left', socket.username);
}
});
});