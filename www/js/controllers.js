angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, User) {
	$scope.user = User.get();
})

.controller('FriendsCtrl', function($scope, Friends) {
  $scope.friends = Friends.all();
})

.controller('FriendDetailCtrl', function($scope, $stateParams, Friends) {
  $scope.friend = Friends.get($stateParams.friendId);
})

.controller('AccountCtrl', function($scope) {
})

.controller('GamesCtrl', function($scope, Games) {
	var update = function(data) {
		$scope.games = data;
	};

	$scope.reload = function() {
		Games.fetchGames(update);
	};

	$scope.reload();
  
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
    
});