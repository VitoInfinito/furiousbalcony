var http = "http://lethe.se:10600";
//var http = 'http://127.0.0.1:10600';
var user = Object();
var socket;

angular.module('starter.services', [])

.factory('Games', ['$http', 
  function($http) {
    

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
      getUserId: function() {
        return user.id;
      },
      fetchUsersGames: function() {
        return $http.get(http + '/listusersgames?id=' + user.id);
      },
      fetchAvailableGames: function() {
        return $http.get(http + '/listavailablegames?id=' + user.id);
      },
      get: function(gameId) {
        return games[gameId];
      },
      createGame: function() {
        return $http.post(http + '/addGame', { name: user.name + "'s game", isOwner: user.id });
      },
      leaveGame: function(gameId) {
        return $http.post(http + "/leavegame", {gameId: gameId, playerId: user.id});
      }
    }
}])

.factory('Game', ['$http', 
  function($http) {

    return {
      fetchGame: function(gameId) {
        return $http.get(http + '/getgamebyid?id=' + gameId);
      },
      fetchExpansions: function() {
        return $http.get(http + '/listExpansions');
      },
      joinGame: function(gameId, playerId, playerName) {
        return $http.post(http + "/joingame", { gameId: gameId, playerId: playerId, playerName: playerName });
      },
      kickPlayer: function(gameId, playerId) {
        return $http.post(http + "/leavegame", {gameId: gameId, playerId: playerId});
      },
      selectCard: function(gameId, playerId, card) {
        return $http.post(http + "/selectCard", {gameId: gameId, playerId: playerId, card: card});
      },
      selectWinningCard: function(gameId, card) {
        return $http.post(http + "/selectWinningCard", {gameId: gameId, card: card});
      },
      readyForNextRound: function(gameId, playerId) {
        return $http.post(http + "/readyForNextRound", {gameId: gameId, playerId: playerId});
      },
      startGame: function(gameId, expList) {
        return $http.post(http + "/startGame", {gameId: gameId, expList: expList});
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

    return {
      setLocalName: function(name) {
        user.name = name;
      },
      getName: function() {
        return user.name;
      },
      getId: function() {
        return user.id;
      },
      checkConnection: function() {
        return $http.get(http + '/checkConnection');
      },
      checkAndSetName: function(name) {
        return $http.get(http + '/checkName?name=' + name + "&id=" + user.id)
      },
      setupNewUserId: function(){
        user.id = rlString(40);
      },
      setupUserId: function(id) {
        user.id = id;
      },
      getUserOfId: function(id) {
        return $http.get(http + '/getuserofid?id=' + id);
      }

    }
}]);
