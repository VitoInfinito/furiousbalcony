var http = "http://lethe.se:10600";
var user = Object();

angular.module('starter.services', [])

.factory('Games', ['$http', 
  function($http) {

    //Save the games for future detailed references
    var games = [];

    return {
      fetchGames: function() {
          return $http.get('http://lethe.se:10600/list');
      },
      fetchGame: function(gameId) {
        return $http.get('http://lethe.se:10600/getgamebyid?id=' + gameId);
      },
      getGames: function() {
        return games;
      },
      get: function(gameId) {
        return games[gameId];
      }
    }
}])

.factory('Game', ['$http', 
  function($http) {

    return {
      fetchGame: function(gameId) {
        return $http.get('http://lethe.se:10600/getgamebyid?id=' + gameId);
      },
      joinGame: function(gameId, playerId, playerName) {
        return $http.post(http + "/joingame", { gameId: gameId, playerId: playerId, playerName: playerName });
      }
    }
}])

.factory('SettingsService', ['$http', 
  function($http) {
    return {
      setName: function(name) {
        user.name = name;
      },
      getName: function() {
        return user.name;
      },
      checkConnection: function() {
        return $http.get(http + '/checkConnection');
      },
      checkName: function(name) {
        return $http.get(http + '/checkName?name=' + name)
      }

    }
}])

.factory('User', function() {
  var user = { id: 0, name: 'Testname' };



  return {
    get: function() {
      // Simple index lookup
      return user;
    }
  }
});
