/**
 * A subclass that represents a request generated by picking a cell
 * It checks if the play is valid and if the game is over
 *
 * @param game Object of class Game
 */
function RequestPlayBot(game) {

  // request type
  var type = "playBot";

  // generate request string
  var requestStr = "" + type + "(" + game.botDiff + "," + game.playBoard.toString() + "," + game.currPlayer + ")";

  // super class constructor
  ServerRequest.call(this, type, requestStr);

  // set request onload
  this.request.onload = function(data) {

    var reply = data.target.response;
    console.log("Request: " + type);
    console.log("Server Reply: " + reply);

    if (reply === "no") {
      console.log("There are no more available cells for bot to play!");
    }
    else {

      //get id of piece played by bot (cells[y][x])
      var id = game.playBoard.cells[reply[2]][reply[0]].id;

      // place piece
      game.switchPieceBoard(id);
      
      // store play
      game.storePlay(new Play(game.currPlayer, id, game));

      // check for game over
      new RequestGameCheck(game);
    }

  };

  // set request onerror
  this.request.onerror = function() {
    console.log("Error waiting for response");
  };

  // send request to the server
  this.request.send();
}
RequestPlayBot.prototype = Object.create(ServerRequest.prototype);
