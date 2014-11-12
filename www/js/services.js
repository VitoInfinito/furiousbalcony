angular.module('starter.services', [])

/**
 * A simple example service that returns some data.
 */
.factory('Friends', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var friends = [
    { id: 0, name: 'Scruff McGruff' },
    { id: 1, name: 'G.I. Joe' },
    { id: 2, name: 'Miss Frizzle' },
    { id: 3, name: 'Ash Ketchum' }
  ];

  return {
    all: function() {
      return friends;
    },
    get: function(friendId) {
      // Simple index lookup
      return friends[friendId];
    }
  }
})

.factory('Games', ['$http', 
  function($http) {
    //Save the games for future detailed references
    var games = [];

  return {
    fetchGames: function(callback) {
      $http.get('http://lethe.se:10600/list')
        .success(function(data){
          games = data;
        }).finally(function() {
          callback(games);
        });
    },
    fetchGame: function(gameId, callback) {
      var game;
      $http.get('http://lethe.se:10600/getgamebyid?id=' + gameId)
        .success(function(data){
          game = data;
        }).finally(function() {
          callback(game);
        });
    },
    getGames: function() {
      return games;
    },
    get: function(gameId) {
      return games[gameId];
    }
  }
}])

.factory('Game', function() {


  return {
    get: function() {
      // Simple index lookup
      return null;
    },
    getUsers: function() {
      
    }
  }
})

.factory('User', function() {
  var user = { id: 0, name: 'Testname' };



  return {
    get: function() {
      // Simple index lookup
      return user;
    }
  }
});
