var _ = require('underscore');
var cards = require('./cards.js');
var maxPlayers = 8;

var gameList = [];
var usernamesTaken = [];

var tempIdCounter = 0;

function getDeck() {
	return cards.getDeck();
};

function removeFromArray(array, item) {
	var index = array.indexOf(item);
	if(index !== -1) {
		array.splice(index, 1);
	}	
};

function addUsername(username, userId) {
	var existingUser = getUserOfId(userId);
	//console.log(existingUser);
	usernamesTaken.push({name: username, id: userId});
	var games = getGamesUserIsIn(userId);
	console.log("adding username " + username + " with id " + userId);
	if(typeof existingUser !== 'undefined') {

		existingUser.name = username;
	        for(i=0; i<games.length; i++) {
			//console.log("gamechanger " + games[i].id);
			for(j=0; j<games[i].players.length; j++) {
				//console.log(games[i].players[j].id + " " + userId);
				if(games[i].players[j].id === userId) {
					//console.log("namechanger " + games[i].id);
					games[i].players[j].name = username;
					break;
				}
			}
		}
        }
	return username;
}

function removeUsername(username) {
	removeFromArray(usernamesTaken, username);
	return username;
}

function checkIfNameTaken(username) {
	return  typeof _.find(usernamesTaken, function(x) { return x.name === username}) !== 'undefined'
}

function getUserOfId(userId) {
	return _.find(usernamesTaken, function(x) { return x.id === userId});
}

function changeUserNameOfId(username, userId) {
	var user = getUserOfId(userId);
	user.name = username;

	var games = getGamesUserIsIn(userId);
	for(i=0; i<games.length; i++) {
                //console.log("gamechanger " + games[i].id);
                for(j=0; j<games[i].players.length; j++) {
                        //console.log(games[i].players[j].id + " " + userId);
                        if(games[i].players[j].id === userId) {
                                //console.log("namechanger " + games[i].id);
                                games[i].players[j].name = username;
                                break;
                        }
                }
        }



}

function getGamesUserIsIn(userId) {
	var games = [];
	for(i=0; i<gameList.length; i++) {
		for(j=0; j<gameList[i].players.length; j++) {
			if(gameList[i].players[j].id === userId) games.push(gameList[i]);
		}
	}
	return games;
}

function getMaxPlayersPerGame() {
	return maxPlayers;
}

function list() {
	return toInfo(_.filter(gameList, function(x) {
		return x.players.length < maxPlayers && !x.isStarted;
	}));
};

function listAll() {
	return toInfo(gameList);
};

function toInfo(fullGameList) {
	return _.map(fullGameList, function(game) {
		return { id: game.id, name: game.name, players: game.players.length };
	});
};

function getRandomId() {
	var alphabet = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var rls = "";
	for(var i=0; i<40; i++) {
		rls = rls + alphabet[Math.floor(Math.random() * (alphabet.length))];
	}
	return rls;
}

function addGame(game) {
	game.players = [];
	game.isStarted = false;
	game.deck = getDeck();
	game.currentBlackCard = "";
	game.pointsToWin = 5;
	game.history = [];
	game.isOver = false;
	game.winningCardId = null;
	game.winnerId = null;
	game.isReadyForScoring = false;
	game.isReadyForReview = false;
//	game.id = tempIdCounter;
	tempIdCounter++;
	game.id = getRandomId();
	gameList.push(game);

	return game;
};

function getGame(gameId) {
	return _.find(gameList, function(x) { return x.id === gameId }) || undefined;
};

function isPlayerPartOfGame(gameId, playerId) {
	var game = getGame(gameId);
	if(game) {
		return typeof _.find(game.players, function(x) { return x.id === playerId}) !== 'undefined';
	}
	return false;
}

function joinGame(game, player) {
	if(game.players.length >= maxPlayers) {
		return 'full game';
	}else if(isPlayerPartOfGame(game.id, player.id)) {
		return 'already in game';
	}
	
	if(typeof _.find(game.players, function(x) { return x.id === player.id}) === 'undefined') {
		var joiningPlayer = {
			id: player.id,
			name: player.name,
			isReady: false,
			cards: [],
			selectedWhiteCardId: null,
			points: 0,
			isCzar: false
		};

		for(var i=0; i<7; i++) {
			drawWhiteCard(game, joiningPlayer);
		}
		
		game.players.push(joiningPlayer);

	
	}else {
		//TODO player is in the game already
		//Might not need to have this else
	}

	
	return game;
};

function leaveGame(gameId, playerId) {
	var game = getGame(gameId);
	if(game) {
		console.log("Player with id " + playerId + " is leaving game with id " + gameId);
		var leavingPlayer = _.find(game.players, function(p) {
			return p.id === playerId;	
		});
		removeFromArray(game.players, leavingPlayer);
		if(game.players.length === 0) {
			removeFromArray(gameList, game);
		}
	}
};

function startGame(gameId) {
	var game = getGame(gameId);
	game.isStarted = true;
	setCurrentBlackCard(game);
	game.players[0].isCzar = true;
}

function endRound(game) {
	game.winnerId = null;
	game.winningCardId = null;
	game.isReadyForScoring = false;
	game.isReadyForReview = false;
	
	setCurrentBlackCard(game);

	_.each(game.players, function(player) {
		if(!player.isCzar) {
			removeFromArray(player.cards, player.selectedWhiteCardId);
			drawWhiteCard(game, player);
		}
	
		player.isReady = false;
		player.selectedWhiteCardId = null;

	});
	
	var playerAmount = game.players.length;
	for(i=0; i<playerAmount; i++) {
		if(game.players[i].isCzar === true) {
			game.players[i].isCzar = false;
			game.players[(i+1)%playerAmount].isCzar = true;
			game.players[(i+1)%playerAmount].isReady = false;
			break;
		}
	}

	if(game.isOver) {
		_.map(game.players, function(p) {
			p.awesomePoints = 0;
		});
		game.IsOver = false;
	}
}

function drawWhiteCard(game, player) {
	var whiteIndex = Math.floor(Math.random() * game.deck.white.length);
	player.cards.push(game.deck.white[whiteIndex]);
	game.deck.white.splice(whiteIndex, 1);
};

function setCurrentBlackCard(game) {
	var index = Math.floor(Math.random() * game.deck.black.length);
	game.currentBlackCard = game.deck.black[index];
	game.deck.black.splice(index, 1);
}

function getPlayer(gameId, playerId) {
	var game = getGame(gameId);
	return _.find(game.players, function(x) { return x.id === playerId; });
}

function getPlayerByCardId(gameId, cardId) {
	var game = getGame(gameId);
	return _.findWhere(game.players, { selectedWhiteCardId: cardId });
}

function selectCard(gameId, playerId, card) {
	var player = getPlayer(gameId, playerId);
	player.selectedWhiteCardId = card;
	player.isReady = false;
	var game = getGame(gameId);
	var readyPlayers = _.filter(game.players, function (x) {
		return x.selectedWhiteCardId;
	});

	if(readyPlayers.length === game.players.length-1) {
		game.isReadyForScoring = true;
	}
}

function selectWinner(gameId, cardId) {
	var player = getPlayerByCardId(gameId, cardId);
	var game = getGame(gameId);
	game.winningCardId = cardId;
	game.isReadyForReview = true;
	player.points = player.points + 1;
	game.history.push({ black: game.currentBlackCard, white: cardId, winner: player.name });
//	delayEndRound(game);

	if(player.points === game.pointsToWin) {
		game = getGame(gameId);
		game.isOver = true;
		game.winnerId = player.id;
	}
}

function reset(){
	gameList = [];
}



exports.addUsername = addUsername;
exports.removeUsername = removeUsername;
exports.checkIfNameTaken = checkIfNameTaken;
exports.getGamesUserIsIn = getGamesUserIsIn;
exports.getDeck = getDeck;
exports.removeFromArray = removeFromArray;
exports.getMaxPlayersPerGame = getMaxPlayersPerGame;
exports.list = list;
exports.listAll = listAll;
exports.addGame = addGame;
exports.getGame = getGame;
exports.isPlayerPartOfGame = isPlayerPartOfGame;
exports.joinGame = joinGame;
exports.leaveGame = leaveGame;
exports.startGame = startGame;
exports.getPlayer = getPlayer;
//exports.readyForNextRound = readyForNextRound;
exports.reset = reset;
exports.endRound = endRound;
exports.selectCard = selectCard;
exports.selectWinner = selectWinner;

