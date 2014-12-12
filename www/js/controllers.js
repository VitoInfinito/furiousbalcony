var http = 'http://lethe.se:10600';
var hasUsername = false;
var socket;

angular.module('starter.controllers', [])

.controller('DashCtrl', function($rootScope, $scope, SettingsService) {

  var setStatusText = function(msg) {
    //TODO Toast (popup message that fades away)
    document.getElementById("dash-stat").style.color = "red";
        $scope.errormsg = msg;
        setTimeout(function() {
          document.getElementById("dash-stat").style.color = "black";

        }, 200);
  };

  var checkAndSetName = function(name) {
    SettingsService.checkAndSetName(name)
          .then(function(success) {
              if(success.data === "taken") {
                setStatusText("Name " + name + " was taken.");
              }else {
                SettingsService.setLocalName(name);
                $scope.dash.hasUsername = true;
                hasUsername = true;
                //Makes other tabs visible
                $rootScope.hasUsername = true;
                initSocket();
              }
            });
  };

  var initSocket = function() {
      socket = io.connect(http + '/');

      socket.removeListener('gameAdded');
      
      socket.on('gameError', function(errorMsg) {
        $scope.$apply(function() {
          $scope.gameError = errorMsg;
        });
      });
    };

  var connectionCallback = function(connected) {
    if(connected) {
      $scope.dash.connected = true;
    }
  };

  $scope.errormsg =  "";
  $scope.dash = {
    checkUsername: function() {
      if(!$scope.dash.checkname) {
        setStatusText("Please enter a name");
      }else if(!$scope.dash.connected) {
        setStatusText("There is currently no connection to the server. Please try again later");
        SettingsService.checkConnection(connectionCallback);
      }else {
        checkAndSetName($scope.dash.checkname);
      }
    },
    connected: false,
    hasUsername: false,
  };



  if(hasUsername) {
    $scope.dash.hasUsername = true;
    $scope.dash.checkname = SettingsService.getName();
    $rootScope.hasUsername = true;
  }

  /*SettingsService.checkConnection()
    .then(function(success) {
        $scope.dash.connected = true;
      });*/
  SettingsService.checkConnection(connectionCallback);


})

.controller('SettingsCtrl', function($scope) {

  socket.removeListener('gameAdded');




})

.controller('GamesCtrl', function($scope, $location, Games) {

  var initGameListSocket = function() {
    socket.on('gameAdded', function(gameList) {
      console.info('gameAdded');
      $scope.$apply(function() {
        $scope.games = gameList;
      });
    });
  };

	$scope.reload = function() {
		Games.fetchGames()
      .then(function(success) {
        var games = success.data;
        console.info('getGames returned ' + games.length + ' items');
        $scope.games = games;
      });
	};

  $scope.createGame = function() {
    Games.createGame()
      .then(function(success) {
        console.info('Game successfully created');
        $location.url("/tab/game/" + success.data.id);
      });
  }


	$scope.reload();
  initGameListSocket();
  
})

.controller('GameDetailCtrl', function($scope, $stateParams, Game) {
    //var socket;
    var playersPerRow = 4;

    var update = function(game) { 
      $scope.game = game;
      $scope.chosenWhiteCards = [];
      console.info(game);

      for(i=0; i<game.players.length; i++) {
        if(game.players[i].id === Game.getUserId()) {
          $scope.currentPlayer = game.players[i];
        }

        if(game.isReadyForScoring && !game.players[i].isCzar) {
          $scope.chosenWhiteCards.push(game.players[i].selectedWhiteCardId);
        }
      }

      if(game.isReadyForReview) {
        $scope.selectedCard = null;
        $scope.sentCard = null;
      }
    };

    var initGameSocket = function() {
      socket.removeListener('gameAdded');
      socket.removeListener('updateGame');
      socket.on('updateGame', function(game) {
        console.info('updateGame');
        $scope.$apply(function() {
          update(game);
        });
      });
      
      socket.on('gameError', function(errorMsg) {
        $scope.$apply(function() {
          $scope.gameError = errorMsg;
        });
      });
    };
    
    var joinGame = function() {
      $scope.getGame();
      Game.joinGame($stateParams.gameId, Game.getUserId(), Game.getUserName())
        .then(function(success) {
          console.info("joinGame success");
          update(success.data);
          initGameSocket();
          socket.emit('connectToGame', { gameId: $stateParams.gameId, playerId: Game.getUserId, playerName: Game.playerName });
      },
      function(error) {
        console.info("joinGame error")
        $scope.gameError = error.data.error;
      });
    };


    /**Code for holding the selected and sent card for both player and czar**/
    $scope.chosenWhiteCards = [];
    $scope.selectedCard = null;
    $scope.sentCard = null;
    $scope.selectCard = function (card) {
      if(!$scope.sentCard) {
        if($scope.selectedCard === card) {
          $scope.sentCard = card;
          if(!$scope.currentPlayer.isCzar) {
            Game.selectCard($stateParams.gameId, Game.getUserId(), card)
              .then(function(success) {
                console.info("Card sent successfully");
                update(success.data);
              });
            }else {
              Game.selectWinningCard($stateParams.gameId, card)
                .then(function(success) {
                  console.info("Winning Card sent successfully");
                  update(success.data);
                });
            }

        }else {
          $scope.selectedCard = card;
        }
      }
    };

    $scope.startGame = function() {
      Game.startGame($stateParams.gameId)
        .then(function(success) {
          update(success.data);
        });
    };

    $scope.getGame = function() {
      Game.fetchGame($stateParams.gameId)
        .then(function(success) {
          $scope.game = success.data;
          update(success.data);
        });
    };

    /**Fetching of players for the two possible rows of people in gui**/
    $scope.isTwoRows = function() {
      return $scope.game && $scope.game.players.length > playersPerRow;
    }

    $scope.getFirstRowOfPlayers = function(){
      if($scope.game && $scope.game.players) {
        return $scope.game.players.slice(0, $scope.game.players.length > playersPerRow ? playersPerRow : $scope.game.players.length);
      }
      return []
    };

    $scope.getLastRowOfPlayers = function(){
      if($scope.game && $scope.game.players && $scope.isTwoRows()) {
        return $scope.game.players.slice(playersPerRow, $scope.game.players.length);
      }
      return [];
    };

    
    /**Notifications and show $scope functions**/
    $scope.notificationIsCzar = function () {
      return $scope.currentPlayer && $scope.currentPlayer.isCzar && !$scope.game.isReadyForReview;
    };

    $scope.notificationSelectCard = function() {
      return $scope.currentPlayer && (!$scope.currentPlayer.isCzar || ($scope.currentPlayer.isCzar && $scope.game.isReadyForScoring)) && !$scope.selectedCard && $scope.game.isStarted && !$scope.game.isReadyForReview;
    };

    $scope.notificationSendCard = function() {
      return $scope.currentPlayer && (!$scope.currentPlayer.isCzar || ($scope.currentPlayer.isCzar && $scope.game.isReadyForScoring)) && $scope.selectedCard && !$scope.sentCard;
    };

    $scope.notificationWaitingOnPlayers = function() {
      return $scope.currentPlayer && ($scope.currentPlayer.isCzar || $scope.sentCard) && !$scope.game.isReadyForScoring;
    };

    $scope.notificationWaitingOnCzar = function() {
      return $scope.currentPlayer && !$scope.currentPlayer.isCzar && $scope.game.isReadyForScoring && !$scope.game.isReadyForReview;
    };

    $scope.notificationNextRound = function() {
      return $scope.game && $scope.game.isReadyForReview;
    };

    $scope.notificationWaitingOnPlayersToJoin = function() {
      return $scope.game && !$scope.game.isStarted && $scope.game.players.length < 3;
    };

    $scope.showCzarCardBox = function() {
      return $scope.currentPlayer && $scope.currentPlayer.isCzar && $scope.game.isStarted && $scope.game.isReadyForScoring && !$scope.game.isReadyForReview;
    };

    $scope.showReviewCardBox = function() {
      return $scope.currentPlayer && $scope.game.isStarted && ($scope.game.isReadyForReview || (!$scope.currentPlayer.isCzar && $scope.game.isReadyForScoring));
    };

    $scope.showCardBox = function() {
      return $scope.currentPlayer && !$scope.currentPlayer.isCzar && $scope.game.isStarted && !$scope.game.isReadyForScoring;
    };

    $scope.showStartGameButton = function() {
      return $scope.game && !$scope.game.isStarted && $scope.game.players.length >= 3 && $scope.currentPlayer && $scope.game.isOwner === $scope.currentPlayer.id;
    };
    

    joinGame();

/*    $scope.$on('$destroy', function(event) {
      console.info('leaving GameCtrl');
      if($scope.game){
        Game.leaveGame($scope.game.id, Game.getUserId());
      }
    });*/
  
    
});