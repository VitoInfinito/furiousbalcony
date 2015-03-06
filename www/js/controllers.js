var hasUsername = false;
var socket;
var debug = false;

angular.module('starter.controllers', [])

.controller('DashCtrl', function($rootScope, $scope, SettingsService) {
  var storingCapability = false;

  var setStatusText = function(msg) {
    //TODO Toast (popup message that fades away)
    angular.element(document.getElementById("dash-stat")).css('color', 'red');
        $scope.errormsg = msg;
        setTimeout(function() {
          angular.element(document.getElementById("dash-stat")).css('color', 'transparent');

        }, 1500);
  };

  var initSocket = function() {
      socket = SettingsService.ioConnection();

      socket.emit('addUserInformation', { userId: SettingsService.getId(), userName: SettingsService.getName(), clientVersion: SettingsService.getClientVersion() });

      socket.removeListener('gameAdded');
      
      socket.on('gameError', function(errorMsg) {
        $scope.$apply(function() {
          $scope.gameError = errorMsg;
        });
      });
    };

  var setNameLocally = function(name) {
    SettingsService.setLocalName(name);
    $scope.dash.hasUsername = true;
    hasUsername = true;
    //Makes other tabs visible
    $rootScope.hasUsername = true;
    $scope.dash.checkname = name;
    document.getElementById("fb-tabs-container").className =
      document.getElementById("fb-tabs-container").className.replace(/\btabs-item-hide\b/,'');
  };

  var checkAndSetName = function(name) {
    SettingsService.checkAndSetName(name)
          .then(function(success) {
              if(success.data === "taken") {
                setStatusText("Name " + name + " was taken.");
              }else {
                setNameLocally(name);
                localStorage.userId = SettingsService.getId();
                initSocket();
              }
            });
  };

  var checkStoredId = function() {
    if(storingCapability) {
      if($scope.dash.connected) {
        if(localStorage.userId) {
          SettingsService.getUserOfId(localStorage.userId)
            .then(function(success) {
                if(success.data !== 'noexist') {
                  SettingsService.setupUserId(success.data.id);
                  setNameLocally(success.data.name);
                  initSocket();
                }else {
                  SettingsService.setupNewUserId();
                }
            },
            function(error) {
              $scope.dash.connected = false;
              checkConnection();
            });
        }else {
          SettingsService.setupNewUserId();
        }
      }else {
        checkConnection();
      }
    }
  };

  $scope.lockdown = false;
  var checkConnection = function() {
    SettingsService.checkConnection()
      .then(function(success) {
        $scope.lockdown = false;
        if(typeof success.data === 'object') {
          $scope.dash.motd = success.data.message;
          if(success.data.code === '404') {
            $scope.lockdown = true;
          }
        }else {
          $scope.dash.motd = success.data;
          if(success.data === "You have to download the latest updates to be able to continue.") {
            $scope.lockdown = true;
          }
        }

        if(!$scope.lockdown) {
          $scope.dash.connected = true;
          checkStoredId();
        }
      },
      function(error) {
        $scope.dash.motd = "There is currently no connection to the server. Will try to connect again shortly."
        setTimeout(function() { checkConnection() }, 10000);
      });
  }

  $scope.errormsg =  "";
  $scope.dash = {
    checkUsername: function() {
      if($scope.lockdown) {
        setStatusText("You are not allowed to connect to the server.");
      }else if(!$scope.dash.checkname) {
        setStatusText("Please enter a name");
      }else if(!$scope.dash.connected) {
        setStatusText("There is currently no connection to the server. Please try again later");
        checkConnection();
      }else {
        checkAndSetName($scope.dash.checkname);
      }
    },
    connected: false,
    hasUsername: false,
    motd: "Trying to connect to the server."
  };

  if(hasUsername) {
    $scope.dash.hasUsername = true;
    $scope.dash.checkname = SettingsService.getName();
    $rootScope.hasUsername = true;
  }

  checkConnection();

  /*Checking and setting up possible id setup*/
  if(typeof(Storage) !== "undefined") {
    storingCapability = true;
  } else {
      setStatusText("Will not be able to save user information upon closing");
      SettingsService.setupNewUserId();
  }

})

.controller('SettingsCtrl', function($scope, SettingsService) {

  var setStatusText = function(msg) {
    //TODO Toast (popup message that fades away)
    angular.element(document.getElementById("settings-stat")).css('color', 'red');
        $scope.errormsg = msg;
        setTimeout(function() {
          angular.element(document.getElementById("settings-stat")).css('color', 'transparent');

        }, 1500);
  };

  var sendNameToServer = function(name) {
    SettingsService.checkAndSetName(name)
        .then(function(success) {
            if(success.data === "taken") {
              setStatusText("Name " + name + " was taken.");
            }else {
              SettingsService.setLocalName(name);
              setStatusText("Successfully changed username to " + $scope.settings.currentName);
            }
        });
  };

  $scope.settings = {
    changeUsername: function() {
      if(!$scope.settings.currentName) {
        setStatusText("Please enter a name");
      }else if(!$scope.settings.connected) {
        setStatusText("There is currently no connection to the server. Please try again later");
      }else if($scope.settings.currentName === SettingsService.getName()) {
        setStatusText("That is already your username");
      }else {
        sendNameToServer($scope.settings.currentName);
      }
    },
    currentName : SettingsService.getName(),
    connected : true
  };

  socket.removeListener('gameAdded');

})

.controller('GamesCtrl', function($scope, $location, Games) {


  $scope.usersGames = [];
  var sortAvailableGamesList = function(gameList) {
    if($scope.availableGames) {
          for(var i=0; i<$scope.usersGames.length; i++) {
              for(var j=0; j<gameList.length; j++) {
                if($scope.usersGames[i].id === gameList[j].id){
                  //TODO: Making new users game list, solution can still be improved
                  gameList.splice(j, 1);
                  break;
                } 
              }
          }
        }

        $scope.availableGames = gameList;
  }

  var initGameListSocket = function() {

    socket.removeListener('gameAdded');

    socket.on('gameAdded', function(gameList) {
      if(debug) console.info('gameAdded');
      $scope.$apply(function() {
        sortAvailableGamesList(gameList);
      });
    });
  };

	$scope.reload = function() {
    //Fetching list with users own games
    /*Games.fetchUsersGames()
      .then(function(success) {
        var usersGames = success.data;
        if(debug) console.info('fetchUsersGames returned ' + usersGames.length + ' items');
        $scope.usersGames = usersGames;
      });

    //Fetching list with available games
    Games.fetchAvailableGames()
      .then(function(success) {
        var availableGames = success.data;
        if(debug) console.info('fetchAvailableGames returned ' + availableGames.length + ' items');
        $scope.availableGames = availableGames;
      });*/

    Games.fetchGames()
      .then(function(success) {
        $scope.usersGames = success.data.usersGames;
        $scope.availableGames = success.data.availableGames;
        $scope.connectedUsers = success.data.connectedUsers;
        $scope.startedGames = success.data.startedGames;
        console.info(success.data);
      });
	};

  $scope.createGame = function() {
    Games.createGame()
      .then(function(success) {
        if(debug) console.info('Game successfully created');
        if(success.data !== 'not allowed') {
          $location.url("/tab/game/" + success.data.id);
        }
      });
  }

  $scope.leaveGame = function(gameId) {
    Games.leaveGame(gameId)
      .then(function(success) {
        $scope.usersGames = success.data;

        //Fetching available games to make the available games list complete.
        Games.fetchAvailableGames()
          .then(function(success) {
            var availableGames = success.data;
            if(debug) console.info('fetchAvailableGames returned ' + availableGames.length + ' items');
            $scope.availableGames = availableGames;
          });
      });
  }

  $scope.gameList = {
    user: true,
    rest: true
  }


	$scope.reload();
  initGameListSocket();
  
})

.controller('GameDetailCtrl', function($scope, $stateParams, $location, $ionicScrollDelegate, Game) {
    var playersPerRow = 4;
    var gameWasOver = false;


    var update = function(game) {
      $scope.chosenWhiteCards = [];
      if(game) {
        //Sorting all players
        for(i=0; i<game.players.length; i++) {
          if(game.players[i].id === Game.getUserId()) {
            $scope.currentPlayer = game.players[i];
          }else {
            delete game.players[i].cards;
          }
        }

        //Checking if player has watched the end of the round
        if($scope.currentPlayer && $scope.currentPlayer.isReadyToSeeWinningCard && !$scope.currentPlayer.hasSeenWinningRound && !startedWatchingEndingOfRound) {
          startedWatchingEndingOfRound = true;
          if(game.roundAmount > 0) {
            countDownNextRound(10);
          }
        }

        $scope.game = game;
        if(debug) console.info(game);
      }
    };

    var initGameSocket = function() {
      socket.removeListener('gameAdded');
      socket.removeListener('updateGame');

      socket.on('updateGame', function(game) {
        if(debug) console.info('updateGame');
        $scope.$apply(function() {
          update(game);
        });
      });

      socket.on('kickPlayer', function(data) {
        if(debug) console.info('kickPlayer');
        $scope.$apply(function() {
          if(data.kickedPlayer === $scope.currentPlayer.id) {
            $location.url("/tab/games");
          }else {
            $scope.selectedCard = null;
            $scope.sentCard = null;
          }
          update(data.game);
        });
      });

      socket.on('receivedMsg', function(data) {
        if(debug) console.info('receivedMsg');
        $scope.$apply(function() {
          if($scope.game) $scope.game.chat = data;
          if($scope.chat.openedChat) {
            $ionicScrollDelegate.$getByHandle('chat').scrollBottom();
            socket.emit('seenLastMsg', { gameId: $stateParams.gameId, playerId: Game.getUserId() });
          }else {
            $scope.chat.unreadMsg = true;
          }
        });
      });
      
      socket.on('gameError', function(errorMsg) {
        $scope.$apply(function() {
          $scope.gameError = errorMsg;
        });
      });
    };

    $scope.kickPlayer = function(playerId) {
      socket.emit('kickPlayer', { gameId: $stateParams.gameId, playerId: playerId });
    }
    
    var joinGame = function() {
      //$scope.getGame();
      Game.joinGame($stateParams.gameId, Game.getUserId(), Game.getUserName())
        .then(function(success) {
          if(debug) console.info("joinGame success");
          update(success.data);
          if($scope.currentPlayer.selectedWhiteCardId) {
            $scope.selectedCard = $scope.currentPlayer.selectedWhiteCardId;
            $scope.sentCard = $scope.currentPlayer.selectedWhiteCardId;
          }
          initGameSocket();
          socket.emit('connectToGame', { gameId: $stateParams.gameId, playerId: Game.getUserId(), playerName: Game.getUserName() });
          
          //Set notification to true if player has an unread message
          if($scope.currentPlayer && $scope.currentPlayer.unreadMsg) {
            $scope.chat.unreadMsg = true;
          }
      },
      function(error) {
        if(debug) console.info("joinGame error")
        if(error.data.error === "invalid GameId" || error.data.error === "too many players") {
          $location.url("/tab/games");
        }
        $scope.gameError = error.data.error;
      });
    };

    $scope.countDown = 0;
    var countDownTimer = null;
    var countDownNextRound = function(timeLeft) {
      $scope.countDown = timeLeft;
      if(--$scope.countDown > 0) {
        if($scope.game && !$scope.game.isOver) {
          countDownTimer = setTimeout(function() {$scope.$apply(function() {countDownNextRound($scope.countDown)});}, 1000);
        }else {
          gameWasOver = true;
        }
      }else {
        sawWinningRound();
      }
    };

    $scope.endRound = function(){
      clearTimeout(countDownTimer);
      sawWinningRound();
    }

    var startedWatchingEndingOfRound = false;
    var sawWinningRound = function() {
      startedWatchingEndingOfRound = false;
      Game.sawWinningRound($stateParams.gameId, Game.getUserId())
        .then(function(success) {
          $scope.selectedCard = null;
          $scope.sentCard = null;
          update(success.data);
        });
    };

    $scope.chat = {
      msgWindow: "",
      sendMsg: function() {
        //Check if the chat message contains at least one non whitespace character
        if (/\S/.test($scope.chat.msgWindow)) {
          socket.emit('sendMsgToRoom', { gameId: $stateParams.gameId, playerId: Game.getUserId(), chatMsg: $scope.chat.msgWindow });
        }

        $scope.chat.msgWindow = "";
      },
      openedChat: false,
      toggleChat: function() {
        $scope.chat.openedChat = !$scope.chat.openedChat;
        $ionicScrollDelegate.$getByHandle('chat').scrollBottom();
        if($scope.chat.unreadMsg) {
          $scope.chat.unreadMsg = false;
          socket.emit('seenLastMsg', { gameId: $stateParams.gameId, playerId: Game.getUserId() });
        }
      },
      unreadMsg: false

    }

    

    //TODO implement so owners can pick amount of players
   /* $scope.playerAmount = 5;
    var playerAmountChangeTimeout;

    $scope.$watch('playerAmount', function() {
      //clearTimeout(playerAmountChangeTimeout);
      //playerAmountChangeTimeout = setTimeout(function() { console.log($scope.playerAmount); }, 1000);
      console.log($scope.playerAmount);
    });*/

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
                if(debug) console.info("Card sent successfully");
                update(success.data);
              });
            }else {
              Game.selectWinningCard($stateParams.gameId, card)
                .then(function(success) {
                  if(debug) console.info("Winning Card sent successfully");
                  update(success.data);
                });
            }

        }else {
          $scope.selectedCard = card;
        }
      }
    };

    $scope.expansions = [];
    $scope.startGame = function() {
      $scope.endRound();
      var expList = [];
      for(x in $scope.expansions) {
        if($scope.expansions[x].chosen === true)
          expList.push($scope.expansions[x].name);
      }

      Game.startGame($stateParams.gameId, expList)
        .then(function(success) {
          update(success.data);
        });
    };

    /*$scope.getGame = function() {
      Game.fetchGame($stateParams.gameId)
        .then(function(success) {
          $scope.game = success.data;
          update(success.data);
        });
    };*/

    /**Fetching of players for the two possible rows of people in gui**/
    $scope.isTwoRows = function() {
      return $scope.game && $scope.game.players.length > playersPerRow;
    }

    $scope.getFirstRowOfPlayers = function(){
      if($scope.game && $scope.game.players) {
        if($scope.game.players.length <= 4 || $scope.game.players.length === 7 || $scope.game.players.length === 8) {
          return $scope.game.players.slice(0, $scope.game.players.length > playersPerRow ? playersPerRow : $scope.game.players.length);
        }else if($scope.game.players.length === 5 || $scope.game.players.length === 6) {
          return $scope.game.players.slice(0, 3);
        }
      }  
      return []
    };

    $scope.getLastRowOfPlayers = function(){
      if($scope.game && $scope.game.players && $scope.isTwoRows()) {
        return $scope.game.players.slice(($scope.game.players.length === 5 || $scope.game.players.length === 6) ? 3 : 4, $scope.game.players.length);
      }
      return [];
    };

    
    /**Notifications and show $scope functions**/
    $scope.hasGameStarted = function() {
      return $scope.game && $scope.game.isStarted;
    }

    $scope.notificationIsCzar = function () {
      return $scope.currentPlayer && $scope.currentPlayer.isCzar && !$scope.currentPlayer.isReadyToSeeWinningCard && $scope.game.isStarted;
    };

    $scope.showBlackCard = function() {
      return $scope.game && $scope.game.currentBlackCard !== '' && $scope.game.isStarted && !startedWatchingEndingOfRound;
    }

    $scope.canKick = function(playerId) {
      return $scope.currentPlayer && $scope.game && $scope.currentPlayer.id === $scope.game.isOwner && $scope.currentPlayer.id !== playerId;
    }

    $scope.notificationSelectCard = function() {
      return $scope.currentPlayer && (!$scope.currentPlayer.isCzar || ($scope.currentPlayer.isCzar && $scope.game.isReadyForScoring)) && !$scope.selectedCard && $scope.game.isStarted && !startedWatchingEndingOfRound;
    };

    $scope.notificationSendCard = function() {
      return $scope.currentPlayer && !$scope.currentPlayer.isCzar && $scope.selectedCard && !$scope.sentCard;
    };

    $scope.notificationSendWinningCard = function() {
      return $scope.currentPlayer && $scope.currentPlayer.isCzar && $scope.game.isReadyForScoring && $scope.selectedCard && !$scope.sentCard;
    }

    $scope.notificationWaitingOnPlayers = function() {
      return !startedWatchingEndingOfRound && $scope.currentPlayer && ($scope.currentPlayer.isCzar || $scope.sentCard) && !$scope.game.isReadyForScoring && $scope.game.isStarted;
    };

    $scope.notificationWaitingOnCzar = function() {
      return $scope.currentPlayer && !$scope.currentPlayer.isCzar && $scope.game.isReadyForScoring && !$scope.game.isReadyForReview;
    };

    $scope.notificationNextRound = function() {
      return $scope.game && $scope.currentPlayer && $scope.currentPlayer.isReadyToSeeWinningCard && !$scope.game.isOver && $scope.game.roundAmount > 0;
    };

    $scope.notificationWaitingOnPlayersToJoin = function() {
      return $scope.game && !$scope.game.isStarted && $scope.game.players.length < 3;
    };

    $scope.notificationWaitingOnPlayersToJoinOrStart = function() {
      return $scope.game && !$scope.game.isStarted && $scope.game.players.length >= 3 && $scope.currentPlayer && $scope.game.isOwner !== $scope.currentPlayer.id;
    };

    $scope.notificationGameIsOver = function() {
      return $scope.game && (($scope.game.isOver && !$scope.currentPlayer.hasSeenWinningRound) || ($scope.game.winnerId !== null && $scope.game.roundAmount === 0 && $scope.currentPlayer.isReadyToSeeWinningCard));
    };

    $scope.showCzarCardBox = function() {
      return $scope.currentPlayer && $scope.currentPlayer.isCzar && $scope.game.isStarted && $scope.game.isReadyForScoring && !$scope.currentPlayer.isReadyToSeeWinningCard && !startedWatchingEndingOfRound;
    };

    $scope.watchRoundEnd = function() {
      return startedWatchingEndingOfRound && $scope.game && !$scope.game.isOver && $scope.game.roundAmount > 0;
    }

    $scope.showSkipReview = function() {
      return startedWatchingEndingOfRound;
    }

    $scope.showReviewCardBox = function() {
      return !startedWatchingEndingOfRound && $scope.currentPlayer && $scope.game.isStarted && (/*startedWatchingEndingOfRound || */(!$scope.currentPlayer.isCzar && $scope.game.isReadyForScoring));
    };

    $scope.showCardBox = function() {
      return $scope.currentPlayer && !$scope.currentPlayer.isCzar && $scope.game.isStarted && !$scope.game.isReadyForScoring && !startedWatchingEndingOfRound;
    };

    $scope.showStartGameButton = function() {
      return $scope.game && !$scope.game.isStarted && $scope.game.players.length >= 3 && $scope.currentPlayer && $scope.game.isOwner === $scope.currentPlayer.id && !$scope.game.isOver;
    };

    $scope.showRestartGameButton = function() {
      return $scope.game && !$scope.game.isStarted && $scope.game.players.length >= 3 && $scope.currentPlayer && $scope.game.isOwner === $scope.currentPlayer.id && $scope.game.isOver;
    };

    $scope.showExpansionsChoice = function() {
      return $scope.game && !$scope.game.isStarted && $scope.currentPlayer && $scope.game.isOwner === $scope.currentPlayer.id;
    };


    joinGame();

    Game.fetchExpansions()
        .then(function(success) {
          $scope.expansions = [];
          for(x in success.data) {
            $scope.expansions.push({chosen: success.data[x] === "Base", name: success.data[x]});
          }
        });

      //Attempt to pick the game up after resuming gameplay
      document.addEventListener("resume", function() {
          joinGame();
      }, false);
    
});