var http = 'http://lethe.se:10600';
var hasUsername = false;

angular.module('starter.controllers', [])

.controller('DashCtrl', function($rootScope, $scope, SettingsService) {
  $scope.showMap = true;
  $scope.showList = false;
  $rootScope.z = true;
  $scope.test = function() {
    $rootScope.showList = true;
  }
  $scope.shouldShow = function() {
    return true;
  }
  $scope.dash = {
    exampleFunction: function() {
      alert($scope.dash.checkname);
    },
    checkUsername: function() {
      if(!$scope.dash.checkname) {
        $scope.dash.errormsg = "Please enter a name";
      }else {
        SettingsService.checkName($scope.dash.checkname)
          .then(function(success) {
              if(success.data === "taken") {
                $scope.dash.errormsg = "Name " + $scope.dash.checkname + " was taken.";
              }else {
                SettingsService.setName($scope.dash.checkname);
                $scope.dash.hasUsername = true;
                hasUsername = true;
                //Makes other tabs visible
                $rootScope.hasUsername = true;
              }
            });
      }
    },
    connected: false,
    hasUsername: false,
    errormsg: ""
  };

  if(hasUsername) {
    $scope.dash.hasUsername = true;
    $scope.dash.checkname = SettingsService.getName();
  }

  SettingsService.checkConnection()
    .then(function(success) {
        $scope.dash.connected = true;

      });


})

.controller('SettingsCtrl', function($scope) {
})

.controller('GamesCtrl', function($scope, Games) {

  var socket;

	$scope.reload = function() {
		Games.fetchGames()
      .then(function(success) {
        var games = success.data;
        console.info('getGames returned ' + games.length + ' items');
        $scope.games = games;
      });
	};

  function initSocket() {
    socket = io.connect(http + '/lobby');

    socket.on('connect', function() {
      console.info('lobby socket connect');
    });
    
    socket.on('gameAdded', function(gameList) {
      console.info('gameAdded');
      $scope.$apply(function() {
        $scope.games = gameList;
      });
    });
  }

	$scope.reload();
  initSocket();


  
})

.controller('GameDetailCtrl', function($scope, $stateParams, Game) {
    var update = function(data) { $scope.game = data; };
    $scope.getGame = function() {
      Game.fetchGame($stateParams.gameId, update)
        .then(function(success) {
          $scope.game = success.data;
        });
    };

    $scope.getGame();

    /*var socket;

    socket = io.connect('http://lethe.se:10600');

    socket.on('connect', function() {
      console.log('Client has connected to the server!');
      socket.emit('connectToGame', { gameId: 0, playerId: 1, playerName: "thisname" });
    });*/

    function initSocket() {
      socket = io.connect(http + '/', {query: 'playerId=' + $routeParams.playerId});
      
      /*if(socket.socket.connected){
        socket.emit('connectToGame', { gameId: $routeParams.gameId, playerId: $routeParams.playerId, playerName: GameService.playerName });
      }*/
      
      socket.on('connect', function() {
        console.info('game socket connect');
        //socket.emit('connectToGame', { gameId: $routeParams.gameId, playerId: $routeParams.playerId, playerName: GameService.playerName });
      });
      
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
    };
    
    function joinGame() {
      Game.joinGame($stateParams.gameId, "7", "testname")
        .then(function(success) {
          console.info("joinGame success");
        renderGame(success.data);
        initSocket();
      },
      function(error) {
        console.info("joinGame error")
        $scope.gameError = error.data.error;
    });
  };

  joinGame();
    
});