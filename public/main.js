$(function () {
    
    // Hilfsvariablen für HTML-Elemente werden mit Hilfe von JQuery gesetzt.
    var $window = $(window);
    var $usernameInput = $('.usernameInput'); // Eingabefeld für Benutzername
    var $messages = $('.messages');           // Liste mit Chat-Nachrichten
    var $inputMessage = $('.inputMessage');   // Eingabefeld für Chat-Nachricht
    var $loginPage = $('.login.page');        // Login-Seite
    var $chatPage = $('.chat.page');          // Chat-Seite
    var age = document.getElementById('age');
    var emo = document.getElementById('emotion');
    var gender = document.getElementById('gender');
    
    var username;                             // Aktueller Benutzername
    var connected = false;                    // Kennzeichen ob angemeldet
    
    var $currentInput = $usernameInput.focus();
    var myElement = document.getElementById('simple-bar');
    new SimpleBar(myElement, { autoHide: false });
    var socket = io();

    function updateScroll(){
      var element = document.getElementById('list');
      element.scrollTop = element.scrollHeight;
    }

    setInterval(updateScroll,1000);
    
    // Tastendruck behandeln
    $window.keydown(function (event) {
    // Die Return-Taste (Ascii 13) behandeln wir speziell
    if (event.which === 13) {
      if (username) {
        // Wenn der Benutzername schon gesetzt ist, handelt es sich
        // um eine Chat-Nachricht.
        sendMessage();
      } else {
        // Wenn der Benutzername noch nicht gesetzt ist, hat sich
        // der Benutzer gerade angemeldet.
        setUsername();
      }
    }
    if (event.which === 32 || event.which === 8) {
      if (username) {
        // Wenn der Benutzername schon gesetzt ist, handelt es sich
        // um eine Chat-Nachricht.
        updateMessage();
      } else {
        // Wenn der Benutzername noch nicht gesetzt ist, hat sich
        // der Benutzer gerade angemeldet.
        
      }
    }
    
    });
    
    // Benutzername wird gesetzt
    function setUsername() {
    // Benutzername aus Eingabefeld holen (ohne Leerzeichen am Anfang oder Ende).
    username = $usernameInput.val().trim();
    
    // Prüfen, ob der Benutzername nicht leer ist
    if (username) {
      // Loginmaske ausblenden und Chat-Seite einblenden
      $loginPage.fadeOut();
      $chatPage.show();
    
      // Chat-Nachricht wird neues, aktuelles Eingabefeld
      $currentInput = $inputMessage.focus();
    
      // Server mit Socket.io über den neuen Benutzer informieren. Wenn die
      // Anmeldung klappt wird der Server die "login"-Nachricht zurückschicken.
      socket.emit('add user', username);
    }
    }
    
    // Chat-Nachricht versenden
    function sendMessage() {
    // Nachricht aus Eingabefeld holen (ohne Leerzeichen am Anfang oder Ende).
    var message = $inputMessage.val();
    
    // Prüfen, ob die Nachricht nicht leer ist und wir verbunden sind.
    if (message && connected) {
      // Eingabefeld auf leer setzen
      $inputMessage.val('');
    
      // Chat-Nachricht zum Chatprotokoll hinzufügen
      removeItem({ username : username});
      addChatMessage({ username: username, message: message, emotion: emo });
          
      // Server über neue Nachricht informieren. Der Server wird die Nachricht
      // an alle anderen Clients verteilen.
      socket.emit('new message', message);
    }
    }

    function updateMessage() {
      // Nachricht aus Eingabefeld holen (ohne Leerzeichen am Anfang oder Ende).
      var message = $inputMessage.val();
      
      // Prüfen, ob die Nachricht nicht leer ist und wir verbunden sind.
      if (message && connected) {
      
        // Chat-Nachricht zum Chatprotokoll hinzufügen
        removeItem({ username : username});
        addTmpMessage({ username: username, message: message, emotion: emo});
            
        // Server über neue Nachricht informieren. Der Server wird die Nachricht
        // an alle anderen Clients verteilen.
        socket.emit('update message', message, emo);
      }
      }

      function updateOthersMessage(data) {
        // Prüfen, ob die Nachricht nicht leer ist und wir verbunden sind.
        if (connected) {
          // Chat-Nachricht zum Chatprotokoll hinzufügen
          removeItem({ username : data.username})
          addTmpMessage({ username: data.username, message: data.message });
        }
        }
    
    // Protokollnachricht zum Chat-Protokoll anfügen
    function log(message) {
    var $el = $('<li>').addClass('log').text(message);
    $messages.append($el);
    }
    
    // Chat-Nachricht zum Chat-Protokoll anfügen
    function addChatMessage(data) {
    var $gifDiv = $('<img src="'+ data.emotion.innerHTML + '.gif", class="emotionImages">');
    var $usernameDiv = $('<span class="username"/>').text(data.username);
    var $messageBodyDiv = $('<span class="messageBody">').text(data.message);
    var $messageDiv = $('<li class="message complete ' + data.emotion.innerHTML + '"/>').append($gifDiv, $usernameDiv, $messageBodyDiv);
    $messages.append($messageDiv);
    if(data.username == username){
      $messageDiv.addClass("currentUser");
    }else {
      $messageDiv.addClass("otherUser");
    }
    }

    // Chat-Nachricht zum Chat-Protokoll anfügen
    function addTmpMessage(data) {
      var $gifDiv = $('<img src="'+ data.emotion.innerHTML + '.gif", class="emotionImages">');
      var $usernameDiv = $('<span class="username"/>').text(data.username);
      var $messageBodyDiv = $('<span class="messageBody">').text(data.message);
      var $messageDiv = $('<li class="message unfinished ' + data.emotion.innerHTML + '", id="unsent_' + data.username+ '"\>').append($gifDiv, $usernameDiv, $messageBodyDiv);
      $messages.append($messageDiv);

      if(data.username == username){
        $messageDiv.addClass("currentUser");
        
      }else {
        $messageDiv.addClass("otherUser");
      }
      }

    function removeItem(data) {
      var listItems = document.getElementById("list").getElementsByTagName("li");
      //var last = listItems[listItems.length - 1];
      for(i = 0; i < listItems.length; i++){
        last = listItems[i];
        if(last.id == ("unsent_" + data.username)){
          last.parentNode.removeChild(last);
        }
      }
      //last.parentNode.removeChild(last);
  }
    
    // ==== Code für Socket.io Events
    
    // Server schickt "login": Anmeldung war erfolgreich
    socket.on('login', function (data) {
    connected = true;
    log("Willkommen beim Chat!");
    });
    
    // Server schickt "new message": Neue Nachricht zum Chat-Protokoll hinzufügen
    socket.on('new message', function (data) {
    addChatMessage(data);
    });

    socket.on('update message', function (data) {
      
      updateOthersMessage(data);
      });
    
    // Server schickt "user joined": Neuen Benutzer im Chat-Protokoll anzeigen
    socket.on('user joined', function (data) {
    log(data + ' joined');
    });
    
    // Server schickt "user left": Benutzer, der gegangen ist, im Chat-Protokoll anzeigen
    socket.on('user left', function (data) {
    log(data + ' left');
    });
    });