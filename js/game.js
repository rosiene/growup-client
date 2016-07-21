
var currentCircles = [];
var currentPlayers = [];
var currentCircle = {};
var socket = io.connect('http://localhost:3030');

//socket.url(')

//socket.connect('http://localhost:3030');

socket.on('circles', function(circles){
  currentCircles = circles;
  updateGame(circles);
});

socket.on('players', function(players){
  currentPlayers = players;
});

runGame();

function runGame(){
  setTimeout(function () {
    socket.emit('load');

    count_players();

    var player = getCurrentPlayerByCircle(currentCircle.id);

    if(player != undefined){
      if (player.alive === 1){
        socket.emit('updateCircle', currentCircle);
        currentCircles.forEach(function(circle){
          if(circle.id != currentCircle.id){
            currentEat(circle);
          }
        });
      }else{
        $('.form').css("display", "inline");
      }
    }
    runGame();
  }, 100);
}

function count_players(){
  var players = currentPlayers.filter(function(player){ return player.alive === 1 });
  var n_players = players.length;
  document.getElementById("n_players").innerHTML = n_players;
}

function setPlayer(event){
  event.preventDefault();

  $('.form').css("display", "none");

  var name = event.target[0].value;
  socket.emit('newPlayerAndCircle', name);
  socket.on('player-circle', function(player, circle){
    currentCircle = circle;
    socket.emit('load');
  });
  window.addEventListener('mousemove', function(event){
    newPosition(event.clientX, event.clientY);
  });
}

function updateGame(circles){
  circles.forEach(function(circle) {
    var circleElement = document.getElementById(circle.id);
    if (circleElement == null){
      newElement(circle)
    }else{
      if (circle.type == 'PLAYER'){
        if (getCurrentPlayerByCircle(circle.id).alive === 0){
          deleteElement(circle);
        }
      }
      updateElement(circle);
    }
  });
}

function newElement(circle){
  var svg = document.getElementById("board");
  var circleElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circleElement.setAttribute("id", circle.id);
  circleElement.setAttribute("r", circle.r);
  circleElement.setAttribute("cx", circle.cx);
  circleElement.setAttribute("cy", circle.cy);
  circleElement.setAttribute("fill", circle.fill);
  svg.appendChild(circleElement);
}

function updateElement(circle){
  var circleElement = document.getElementById(circle.id);
  circleElement.setAttribute("r", circle.r);
  circleElement.setAttribute("cx", circle.cx);
  circleElement.setAttribute("cy", circle.cy);
  circleElement.setAttribute("fill", circle.fill);
}

function deleteElement(circle){
  var svg = document.getElementById("board");
  var circleElement = document.getElementById(circle.id);
  svg.removeChild(circleElement);
}

function newPosition(x, y){
  currentCircle.cx = x;
  currentCircle.cy = y;
}

function currentEat(circle){
  var startX = parseInt(currentCircle.cx) - parseInt(currentCircle.r);
  var startY = parseInt(currentCircle.cy) - parseInt(currentCircle.r);
  var endX = parseInt(currentCircle.cx) + parseInt(currentCircle.r);
  var endY = parseInt(currentCircle.cy) + parseInt(currentCircle.r);

  if (startX < parseInt(circle.cx) &&
       startY < parseInt(circle.cy) &&
      endX > parseInt(circle.cx) &&
      endY > parseInt(circle.cy)){
    if(circle.type == "FOOD"){
      circle.cx = Math.floor(Math.random() * 990);
      circle.cy = Math.floor(Math.random() * 640);
      circle.fill = randomColors();
      socket.emit('updateCircle', circle);
      var player = getCurrentPlayerByCircle(currentCircle.id);

      //SCORE
      player.score = 1 + parseInt(player.score);
      socket.emit('updatePlayer', player);

      //GROW
      currentGrow(circle);
    }else{
      if(circle.id != currentCircle.id &&
          parseFloat(circle.r) < parseFloat(currentCircle.r)){
        //KILL
        deleteElement(circle);
        var player = getCurrentPlayerByCircle(circle.id);
        player.alive = 0;
        socket.emit('updatePlayer', player);
      }
    }
  }
}

function getCurrentPlayerByCircle(id_circle){
  return currentPlayers.filter(function(player){ return player.id_circle === id_circle })[0];
}

function randomColors(){
  var colors = ["#ff1a1a", "#3366ff", "#33cc33", "#ffff00", "#ff0066", "#ff471a", "#cc0099"];
  return colors[Math.floor(Math.random() * colors.length)];
}


function currentGrow(circle){
  newSize = parseFloat(currentCircle.r) + parseFloat(circle.r)/30;
  currentCircle.r = newSize.toFixed(1);
  socket.emit('updateCircle', currentCircle);
}
