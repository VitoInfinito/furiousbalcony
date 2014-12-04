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

.controller('GamesCtrl', function($scope, Games) {

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
      });
  }

  function initSocket() {
    socket = io.connect(http + '/lobby');

    socket.on('connect', function() {
      console.info('lobby socket connect');
      socket.emit('test');
    });
    
    socket.on('gameAdded', function(gameList) {
      console.info('gameAdded');
      $scope.$apply(function() {
        $scope.games = gameList;
      });
    });
  }

	$scope.reload();
  //initSocket();
  socket = io(http + '/');
  socket.on('gameAdded', function(gameList) {
      console.info('gameAdded');
      $scope.$apply(function() {
        $scope.games = gameList;
      });
    });
  socket.emit('testz', { my: 'data' });
  
})

.controller('GameDetailCtrl', function($scope, $stateParams, Game) {
    //var socket;

    var update = function(data) { $scope.game = data; };
    $scope.getGame = function() {
      Game.fetchGame($stateParams.gameId, update)
        .then(function(success) {
          $scope.game = success.data;
        });
    };

    var renderGame = function(game) {
      $scope.game = game;

    };

    $scope.getGame();

    /*
    socket = io.connect('http://lethe.se:10600');

    socket.on('connect', function() {
      console.log('Client has connected to the server!');
      socket.emit('connectToGame', { gameId: 0, playerId: 1, playerName: "thisname" });
    });*/



    function initSocket() {
      //socket = io.connect(http + '/', {query: 'playerId=' + Game.getUserId()});
      //socket = io.connect(http + '/');
      //socket = io.connect(http + '/connectToGame', {query: 'gameId=' + $stateParams.gameId +  '&playerId=' + Game.getUserId + '&playerName=' + Game.playerName});
      //console.info(socket);
      //console.info(socket.connected);

      //socket.emit('connectToGame', { gameId: $stateParams.gameId, playerId: Game.getUserId, playerName: Game.playerName });

      //if(socket.connected){
      //  console.info('socket.connected');

        //socket.emit('connectToGame', { gameId: $routeParams.gameId, playerId: $routeParams.playerId, playerName: GameService.playerName });
      //}
      
      //socket.on('connect', function() {
      //  console.info('game socket connect');
        //socket.emit('connectToGame', { gameId: $stateParams.gameId, playerId: Game.getUserId, playerName: Game.playerName });
      //});
      
      socket.on('updateGame', function(game) {
        console.info('updateGame');
        console.info(game);
        $scope.$apply(function() {
          renderGame(game);
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
          console.info(success.data.players[0]);
        renderGame(success.data);
        initSocket();
        socket.emit('connectToGame', { gameId: $stateParams.gameId, playerId: Game.getUserId, playerName: Game.playerName });
        
      },
      function(error) {
        console.info("joinGame error")
        $scope.gameError = error.data.error;
    });
  };

  joinGame();
  
    
});