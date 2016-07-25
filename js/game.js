
var currentCircles = [];
var currentPlayers = [];
var currentCircle = {};
var currentPlayer = {};
var position = {x: 1500, y: 1000};
var socket = io.connect('http://localhost:3000');
var svgElement = document.getElementById("board");
var delay = 10;

socket.on('circles', function(circles){
  currentCircles = circles;
});

socket.on('players', function(players){
  currentPlayers = players;
});

centerSvg();
runGame();

function runGame(){
  setTimeout(function () {
    socket.emit('load', currentPlayer);

    count_players();
    updateCurrentPlayer();
    updateAllElements();

    if(currentPlayer != undefined){
      if (currentPlayer.alive === 1){
        $('.form').css("display", "none");

        socket.emit('updateCircle', currentCircle);

        currentCircles.forEach(function(circle){
          if(circle.id != currentCircle.id){
            currentEat(circle);
          }
        });
        currentDelay();
      }else{
        $('.form').css("display", "inline");
      }
    }
    runGame();
    console.log(delay);
  }, delay);
}

function count_players(){
  var players = currentPlayers.filter(function(player){ return player.alive === 1 });
  var n_players = players.length;
  document.getElementById("n_players").innerHTML = n_players;
}

function setNewPlayer(event){
  event.preventDefault();

  $('.form').css("display", "none");

  var name = document.getElementById("name").value;
  document.getElementById("name").value = "";

  currentCircle = {id: 0, r: 20, cx: 1500, cy: 1000, fill: randomColors(), type: 'PLAYER'};
  socket.emit('newCircle', currentCircle);

  socket.on('circle', function(circle){
    currentCircle = circle;

    currentPlayer = {id: 0, id_circle: currentCircle.id, name: name, score: 0, alive: 1};
    socket.emit('newPlayer', currentPlayer);

    socket.on('player', function(player){
      currentPlayer = player;
    });

    socket.emit('load');
  });

  window.addEventListener('mousemove', function(event){
    newPosition(event.clientX, event.clientY);
  });
}

function updateCurrentPlayer(){
  currentPlayers.forEach(function(player){
    if(currentPlayer.id === player.id){
      currentPlayer = player;
    }
  });
}

function updateAllElements(){
  currentCircles.forEach(function(circle){
    var circleElement = document.getElementById(circle.id);
    if(circle.type == 'PLAYER'){
      var player = getPlayerByCircle(circle);

      if (circleElement == null && player.alive === 1){
        newElement(circle);
      }else if (player.alive === 0) {
        deleteElement(circle);
      }else{
        updateElement(circle);
      }
    }else{ //FOOD
      if (circleElement == null){
        newElement(circle)
      }else{
        updateElement(circle);
      }
    }
  });
}

function newElement(circle){
  var circleElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circleElement.setAttribute("id", circle.id);
  circleElement.setAttribute("r", circle.r);
  circleElement.setAttribute("cx", circle.cx);
  circleElement.setAttribute("cy", circle.cy);
  circleElement.setAttribute("fill", circle.fill);
  svgElement.appendChild(circleElement);
}

function updateElement(circle){
  var circleElement = document.getElementById(circle.id);
  circleElement.setAttribute("r", circle.r);
  circleElement.setAttribute("cx", circle.cx);
  circleElement.setAttribute("cy", circle.cy);
  circleElement.setAttribute("fill", circle.fill);
}

function deleteElement(circle){
  var circleElement = document.getElementById(circle.id);
  if (circleElement){
    svgElement.removeChild(circleElement);
  }
}

function getPlayerByCircle(circle){
  return currentPlayers.filter(function(player){ return player.id_circle === circle.id })[0];
}

function newPosition(x, y){
  var newX = parseInt(x) + parseInt(window.pageXOffset);
  var newY = parseInt(y) + parseInt(window.pageYOffset);
  position = {x: newX, y: newY};
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

      //SCORE
      currentPlayer.score = 1 + parseInt(currentPlayer.score);
      socket.emit('updatePlayer', currentPlayer);

      //GROW
      currentGrow(circle);

    }else{
      if(circle.id != currentCircle.id &&
          parseFloat(circle.r) < parseFloat(currentCircle.r)){
        //KILL
        var player = getPlayerByCircle(circle);
        player.alive = 0;
        socket.emit('updatePlayer', player);
      }
    }
  }
}

function currentGrow(circle){
  newSize = parseFloat(currentCircle.r) + parseFloat(circle.r)/30;
  currentCircle.r = newSize.toFixed(1);
  socket.emit('updateCircle', currentCircle);
}

function currentDelay(){
  var score = parseInt(currentPlayer.score);
  if (score > delay){
    delay = score;
  }

  var cx = parseFloat(currentCircle.cx);
  var cy = parseFloat(currentCircle.cy);
  var x = parseFloat(position.x);
  var y = parseFloat(position.y);

  if(cx < x){
    cx += 2;
  }else if (cx > x) {
    cx -= 2;
  }
  if(cy < y){
    cy += 2;
  }else if (cy > y) {
    cy -= 2;
  }

  currentCircle.cx = cx;
  currentCircle.cy = cy;

  scrollMove(currentCircle.cx, currentCircle.cy);

  socket.emit('updateCircle', currentCircle);
}

function slowMotion(){

}

function scrollMove(x, y){
  var centerWindowX = parseInt(window.innerWidth)/2;
  var centerWindowY = parseInt(window.innerHeight)/2;

  if(centerWindowX < x){
    var newX = x - centerWindowX;
    window.scrollTo(newX, window.pageYOffset);
  }

  if(centerWindowY < y){
    var newY = y - centerWindowY;
    window.scrollTo(window.pageXOffset, newY);
  }
}

function centerSvg(){
  var svgW = parseInt(svgElement.getAttribute("width"));
  var svgH = parseInt(svgElement.getAttribute("height"));

  var screamW = parseInt(window.innerWidth);
  var screamH = parseInt(window.innerHeight);

  var w = svgW/2 - screamW/2;
  var h = svgH/2 - screamH/2;
}

function randomColors(){
  var colors = ["#ff1a1a", "#3366ff", "#33cc33", "#ffff00", "#ff0066", "#ff471a", "#cc0099"];
  return colors[Math.floor(Math.random() * colors.length)];
}
