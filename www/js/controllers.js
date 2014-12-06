var http = 'http://lethe.se:10600';
var hasUsername = false;
var socket;

angular.module('starter.controllers', [])

.controller('DashCtrl', function($rootScope, $scope, SettingsService) {

  var setStatusText = function(msg) {
    //TODO Toast (popup message that fades away)
    document.getElementById("dash-stat").style.color = "red";
        $scope.dash.errormsg = msg;
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
              }
            });
  };

  var connectionCallback = function(connected) {
    if(connected) {
      $scope.dash.connected = true;
    }
  };

  $scope.dash = {
    exampleFunction: function() {
      alert($scope.dash.checkname);
    },
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
    errormsg: ""
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
})

.controller('GamesCtrl', function($scope, $location, Games) {

  //var socket;

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

  function initSocket() {
    socket = io.connect(http + '/');

    socket.on('connect', function() {
      console.info('lobby socket connect');
      //socket.emit('test');
      $scope.reload();
    });
    
    socket.on('gameAdded', function(gameList) {
      console.info('gameAdded');
      $scope.$apply(function() {
        $scope.games = gameList;
      });
    });
  }

	//$scope.reload();
  initSocket();
  
})

.controller('GameDetailCtrl', function($scope, $stateParams, Game) {
    //var socket;

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

    var update = function(game) { 
      $scope.game = game;
      $scope.chosenWhiteCards = [];
      console.info(game);
      console.info(game.players)

      for(i=0; i<game.players.length; i++) {
        console.info(game.players[i].id + " " + Game.getUserId());
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

      console.info(game);
    };

    

    $scope.notificationIsCzar = function () {
      return $scope.currentPlayer && $scope.currentPlayer.isCzar && !$scope.game.isReadyForReview;
    };

    $scope.notificationSelectCard = function() {
      return $scope.currentPlayer && (!$scope.currentPlayer.isCzar || ($scope.currentPlayer.isCzar && $scope.game.isReadyForScoring)) && !$scope.selectedCard && $scope.game.isStarted;
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

    $scope.showCzarCardBox = function() {
      return $scope.currentPlayer && $scope.currentPlayer.isCzar && $scope.game.isStarted && $scope.game.isReadyForScoring && !$scope.game.isReadyForReview;
    };

    $scope.showReviewCardBox = function() {
      return $scope.currentPlayer && $scope.game.isStarted && $scope.game.isReadyForReview;
    };

    $scope.showCardBox = function() {
      return $scope.currentPlayer && !$scope.currentPlayer.isCzar && $scope.game.isStarted && !$scope.game.isReadyForScoring;
    };

    $scope.showStartGameButton = function() {
      return $scope.game && !$scope.game.isStarted && $scope.game.players.length >= 3 && $scope.currentPlayer.isCzar;
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

    $scope.getGame();



    function initSocket() {
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

      socket.on('testx', function(data) {
        console.info(data);
      });
    };
    
    function joinGame() {
      Game.joinGame($stateParams.gameId, Game.getUserId(), Game.getUserName())
        .then(function(success) {
          console.info("joinGame success");
        update(success.data);
        initSocket();
        socket.emit('connectToGame', { gameId: $stateParams.gameId, playerId: Game.getUserId, playerName: Game.playerName });
        
      },
      function(error) {
        console.info("joinGame error")
        $scope.gameError = error.data.error;
    });
  };

  joinGame();

  $scope.$on('$destroy', function(event) {
    console.info('leaving GameCtrl');
    if($scope.game){
      Game.leaveGame($scope.game.id, Game.getUserId());
    }
  });
  
    
});