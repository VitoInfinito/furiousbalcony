var _ = require('underscore');
var cards = require('./cards.js');

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

function addUsername(username) {
	usernamesTaken.push(username);
	return username;
}

function removeUsername(username) {
	removeFromArray(usernamesTaken, username);
	return username;
}

function checkIfNameTaken(username) {
	return  usernamesTaken.indexOf(username) !== -1;
}

function list() {
	return toInfo(_.filter(gameList, function(x) {
		return x.players.length < 4 && !x.isStarted;
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

function joinGame(game, player) {
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

		if(game.players.length === 4) {
			if(!game.isStarted){
				startGame(game);
			} else {
				//someone may have dropped and rejoined. If it was the Czar, we need to re-elect the re-joining player
				var currentCzar = _.find(game.players, function(p) {
				return p.isCzar == true;
			});
			
				if(!currentCzar){
					game.players[game.players.length - 1].isCzar = true;
				}
			}
		}
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

function startGame(game) {
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

	for(i=0; i<4; i++) {
		if(game.players[i].isCzar === true) {
			game.players[i].isCzar = false;
			game.players[(i+1)%4].isCzar = true;
			game.players[(i+1)%4].isReady = false;
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

function readyForNextRound(gameId, playerId) {
	var player = getPlayer(gameId, playerId);
	player.isReady = true;
	var game = getGame(gameId);
	var allReady = _.every(game.players, function(x) {
		return x.isReady;
	});

	if(allReady) {
		endRound(game);
	}
}


function selectCard(gameId, playerId, card) {
	var player = getPlayer(gameId, playerId);
	player.selectedWhiteCardId = card;
	player.isReady = false;
	var game = getGame(gameId);
	var readyPlayers = _.filter(game.players, function (x) {
		return x.selectedWhiteCardId;
	});

	if(readyPlayers.length === 3) {
		game.isReadyForScoring = true;
	}
}

function delayEndRound(game) {
	setTimeout(endRound(game), 10000);
}

function selectWinner(gameId, cardId) {
	var player = getPlayerByCardId(gameId, cardId);
	var game = getGame(gameId);
	game.winningCardId = cardId;
	game.isReadyForReview = true;
	player.points = player.points + 1;
	game.history.push({ black: game.currentBlackCard, white: cardId, winner: player.name });
//	delayEndRound(game);

	if(player.awesomePoints === game.pointsToWin) {
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
exports.getDeck = getDeck;
exports.removeFromArray = removeFromArray;
exports.list = list;
exports.listAll = listAll;
exports.addGame = addGame;
exports.getGame = getGame;
exports.joinGame = joinGame;
exports.leaveGame = leaveGame;
exports.getPlayer = getPlayer;
exports.readyForNextRound = readyForNextRound;
exports.reset = reset;
exports.endRound = endRound;
exports.selectCard = selectCard;
exports.selectWinner = selectWinner;
