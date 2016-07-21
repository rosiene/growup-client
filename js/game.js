
var currentCircles = [];
var currentPlayers = [];
var currentCircle = {};
var position = {x: 500, y: 500};
var svgElement = document.getElementById("board");
var socket = io.connect('http://localhost:3000');

socket.on('circles', function(circles){
  currentCircles = circles;
  updateGame(circles);
});

socket.on('players', function(players){
  currentPlayers = players;
});

centerSvg();
runGame();

function runGame(){
  setTimeout(function () {
    socket.emit('load');

    count_players();

    var player = getCurrentPlayerByCircle(currentCircle);

    if(player != undefined){
      if (player.alive === 1){
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
        if (getCurrentPlayerByCircle(circle).alive === 0){
          deleteElement(circle);
        }
      }
      updateElement(circle);
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
  svgElement.removeChild(circleElement);
}

function newPosition(x, y){
  position = {x: x, y: y};
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
      var player = getCurrentPlayerByCircle(currentCircle);

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
        var player = getCurrentPlayerByCircle(circle);
        player.alive = 0;
        socket.emit('updatePlayer', player);
      }
    }
  }
}

function getCurrentPlayerByCircle(circle){
  return currentPlayers.filter(function(player){ return player.id_circle === circle.id })[0];
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

function currentDelay(){
    var player = getCurrentPlayerByCircle(currentCircle);
    var newDelay = 1 + parseFloat(player.score)/5;

    console.log(" newDeplay ", newDelay);

    player.delay = newDelay;

    var cx = parseFloat(currentCircle.cx);
    var cy = parseFloat(currentCircle.cy);
    var x = parseFloat(position.x);
    var y = parseFloat(position.y);

    currentCircle.cx = cx + ((x-cx)/newDelay);
    currentCircle.cy = cy + ((y-cy)/newDelay);

    socket.emit('updateCircle', currentCircle);
}

function scrollMove(w, h){
  window.scrollTo(w, h);
}

function centerSvg(){
  var svgW = parseInt(svgElement.getAttribute("width"));
  var svgH = parseInt(svgElement.getAttribute("height"));

  var screamW = parseInt(window.innerWidth);
  var screamH = parseInt(window.innerHeight);

  var w = svgW/2 - screamW/2;
  var h = svgH/2 - screamH/2;
  console.log(w, h);
  window.scrollTo(w, h);
}
