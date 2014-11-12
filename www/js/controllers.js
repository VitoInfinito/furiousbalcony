angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, User) {
	$scope.user = User.get();
})

.controller('SettingsCtrl', function($scope) {
})

.controller('GamesCtrl', function($scope, Games) {
	var update = function(data) {
		$scope.games = data;
	};

	$scope.reload = function() {
		Games.fetchGames(update);
	};

	$scope.reload();

  var socket;
  socket = io.connect('http://lethe.se:10600/lobby');
  
})

.controller('GameDetailCtrl', function($scope, $stateParams, Games) {
	var findGame = function(gameId) {
		var games = Games.getGames();
      	if(typeof gameId !== 'undefined') {
        	for(game in games) {
          		if(gameId === games[game].id) {
         		   	return games[game];
          		}
        	}
      	}
      	return null;
    };

    var update = function(data) { $scope.game = data; };
    $scope.getGame = function() {
      Games.fetchGame($stateParams.gameId, update);
    };
    /*$scope.game = findGame(parseInt($stateParams.gameId));*/

    $scope.getGame();

    var socket;

    socket = io.connect('http://lethe.se:10600');

    socket.on('connect', function() {
      console.log('Client has connected to the server!');
      socket.emit('connectToGame', { gameId: 0, playerId: 1, playerName: "thisname" });
    });
    
});