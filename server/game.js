var _ = require('underscore');
var cards = require('./cards.js');
var maxPlayers = 8;

var gameList = [];
var usernamesTaken = [];

function getDeck(expList) {
	if(expList.length > 0) {
		return cards.getDeck(expList);
	}else {
		return cards.getDeck(["Base"]);
	}
};

function getExpansions() {
	return cards.expansions();
};

function removeFromArray(array, item) {
	var index = array.indexOf(item);
	if(index !== -1) {
		array.splice(index, 1);
	}	
};

function shuffle(array) {
	var m = array.length, t, i;

	// While there remain elements to shuffle…
	while (m) {

		// Pick a remaining element…
		i = Math.floor(Math.random() * m--);

		// And swap it with the current element.
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	}

	return array;
}

function addUsername(username, userId) {
	var existingUser = getUserOfId(userId);
	//console.log(existingUser);
	//usernamesTaken.push({name: username, id: userId});
	var games = getGamesUserIsIn(userId);
	//console.log("adding username " + username + " with id " + userId);
	if(typeof existingUser !== 'undefined') {
		
		//removeUser(existingUser);
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
        }else {
		usernamesTaken.push({name: username, id: userId});
	}
	return username;
}

function removeUser(user) {
	removeFromArray(usernamesTaken, user);
	return user.name;
}

function checkIfNameTaken(username) {
	return  typeof _.find(usernamesTaken, function(x) { return x.name === username}) !== 'undefined';
}

function getUserOfId(userId) {
	return _.find(usernamesTaken, function(x) { return x.id === userId});
}

function getNameOfGame(gameId) {
	return getGame(gameId).name;
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
	return toInfo(games);
}

function getAvailableGamesForUser(userId) {
	var games = [];
	var addToList = true;
        for(i=0; i<gameList.length; i++) {
		addToList = true;
                for(j=0; j<gameList[i].players.length; j++) {
                        if(gameList[i].players[j].id === userId) addToList = false;
                }
		if(addToList) games.push(gameList[i]);
        }
 //       return games;
	return toInfo(_.filter(games, function(x) {
                return x.players.length < maxPlayers && !x.isStarted;
        }));

}

function getMaxPlayersPerGame() {
	return maxPlayers;
}

function list() {
	return toInfo(_.filter(gameList, function(x) {
		return x.players.length < maxPlayers && !x.isStarted;
	}));
};

function listTimestamp() {
	return toInfoTimestamp(gameList);
}

function listAll() {
	return toInfo(gameList);
};

function toInfo(fullGameList) {
	return _.map(fullGameList, function(game) {
		return { id: game.id, name: game.name, players: game.players.length };
	});
};

function toInfoTimestamp(fullGameList) {
	return _.map(fullGameList, function(game) {
		return { id: game.id, createdAt: game.createdAt };
	});
}

function getRandomId() {
	var alphabet = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var rls = "";
	for(var i=0; i<40; i++) {
		rls = rls + alphabet[Math.floor(Math.random() * (alphabet.length))];
	}
	return rls;
}

function canUserCreateGame(userId) {
	return typeof _.find(gameList, function(x) { return x.isOwner === userId && !x.isStarted }) === 'undefined';
}

function addGame(game) {
	game.players = [];
	game.playerAmount = 8;
	game.isStarted = false;
	game.currentBlackCard = "";
	game.pointsToWin = 10;
	game.history = [];
	game.isOver = false;
	game.winningCardId = null;
	game.winnerId = null;
	game.chosenWhiteCards = [];
	game.isReadyForScoring = false;
	game.isReadyForReview = false;
	game.id = getRandomId();
	gameList.push(game);
	game.createdAt = new Date();

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

		game.players.push(joiningPlayer);
	}

	
	return game;
};

function leaveGame(gameId, playerId) {
	var game = getGame(gameId);
	if(game) {
		//console.log("Player with id " + playerId + " is leaving game with id " + gameId);
		var leavingPlayer = _.find(game.players, function(p) {
			return p.id === playerId;	
		});
		removeFromArray(game.players, leavingPlayer);
		if(game.players.length === 0) {
			removeFromArray(gameList, game);
		}else if(game.players.length === 2) {
			resetGame(gameId);
		}

		if(game.isOwner === playerId && game.players.length > 0) {
			game.isOwner = game.players[0].id;
		}
	}
};

function resetGame(gameId) {
        var game = getGame(gameId);
        if(game) {
                game.isStarted = false;
                game.createdAt = new Date();
                game.chosenWhiteCards = [];
		game.isOver = false;
                game.winnerId = null;
		game.history = [];
		game.currentBlackCard = "";
		game.isReadyForScoring = false;
		game.isReadyForReview = false;
                for(x in game.players) {
                        game.players[x].selectedWhiteCardId = null;
			game.players[x].isCzar = false;
			game.players[x].isReady = false;
			game.players[x].points = 0;
                }
        }

};

function startGame(gameId, expList) {
	var game = getGame(gameId);
	if(game) {
		if(game.winnerId) {
			resetGame(gameId);
		}
		game.deck = getDeck(expList);
		for(var i=0; i<game.players.length; i++) {
			game.players[i].cards = [];
			for(var j=0; j<7; j++) {
	                        drawWhiteCard(game, game.players[i]);
	                }
		}
		game.isStarted = true;
		setCurrentBlackCard(game);
		game.players[0].isCzar = true;
	}
};

function endRound(game) {
	game.winnerId = null;
	game.winningCardId = null;
	game.isReadyForScoring = false;
	game.isReadyForReview = false;
	game.chosenWhiteCards = [];
	
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

function setPlayerAmount(gameId, amount) {
	var game = getGame(gameId);
	if(game) {
		game.playerAmount = amount;
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
	if(!player.selectedWhiteCardId) {
		player.selectedWhiteCardId = card;
		player.isReady = false;
		var game = getGame(gameId);
		game.chosenWhiteCards.push(card);
		var readyPlayers = _.filter(game.players, function (x) {
			return x.selectedWhiteCardId;
		});

		if(readyPlayers.length === game.players.length-1) {
			game.isReadyForScoring = true;
			shuffle(game.chosenWhiteCards);
		}
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
		game.isStarted = false;
		game.createdAt = new Date();
		game.winnerId = player.name;
		return false;
	}
	return true;
}

function reset(){
	gameList = [];
}



exports.getExpansions = getExpansions;
exports.addUsername = addUsername;
exports.removeUser = removeUser;
exports.getUserOfId = getUserOfId;
exports.getNameOfGame = getNameOfGame;
exports.checkIfNameTaken = checkIfNameTaken;
exports.getGamesUserIsIn = getGamesUserIsIn;
exports.getAvailableGamesForUser = getAvailableGamesForUser;
exports.getDeck = getDeck;
exports.removeFromArray = removeFromArray;
exports.getMaxPlayersPerGame = getMaxPlayersPerGame;
exports.list = list;
exports.listAll = listAll;
exports.listTimestamp = listTimestamp;
exports.canUserCreateGame = canUserCreateGame;
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
exports.setPlayerAmount = setPlayerAmount;
