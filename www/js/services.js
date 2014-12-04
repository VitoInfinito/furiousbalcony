var http = "http://lethe.se:10600";
var user = Object();
var socket;

angular.module('starter.services', [])

.factory('Games', ['$http', 
  function($http) {
    var alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var rl = function() {
      return alphabet[Math.floor(Math.random() * (alphabet.length))];
    }

    var rlString = function(length) {
      var rls = "";
      for(var i=0; i<length; i++) {
        rls = rls + rl();
      }
      return rls;
    }
    
    user.id = rlString(40);
    console.log(user.id);

    //Save the games for future detailed references
    var games = [];

    return {
      fetchGames: function() {
          return $http.get(http + '/list');
      },
      fetchGame: function(gameId) {
        return $http.get(http + '/getgamebyid?id=' + gameId);
      },
      getGames: function() {
        return games;
      },
      get: function(gameId) {
        return games[gameId];
      },
      createGame: function() {
        return $http.post(http + '/addGame', { name: user.name + "'s game" });
      }
    }
}])

.factory('Game', ['$http', 
  function($http) {

    return {
      fetchGame: function(gameId) {
        return $http.get(http + '/getgamebyid?id=' + gameId);
      },
      joinGame: function(gameId, playerId, playerName) {
        return $http.post(http + "/joingame", { gameId: gameId, playerId: playerId, playerName: playerName });
      },
      getUserId: function() {
        return user.id;
      },
      getUserName: function() {
        return user.name;
      }
    }
}])

.factory('SettingsService', ['$http', 
  function($http) {

    return {
      setLocalName: function(name) {
        user.name = name;
      },
      getName: function() {
        return user.name;
      },
      checkConnection: function(callback) {
        $http.get(http + '/checkConnection').success(function(data) {
          callback(true);
        }).error(function(data) {
          callback(false);
        })
      },
      checkAndSetName: function(name) {
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
