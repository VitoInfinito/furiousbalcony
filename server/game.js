var _ = require('underscore');
var cards = require('./cards.js');
var maxPlayers = 8;

var gameList = [];
var usernamesTaken = [];


/**  Utility  **/
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

function removeFromArray(array, item) {
	var index = array.indexOf(item);
	if(index !== -1) {
		array.splice(index, 1);
	}	
};

function getRandomId() {
	var alphabet = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var rls = "";
	for(var i=0; i<40; i++) {
		rls = rls + alphabet[Math.floor(Math.random() * (alphabet.length))];
	}
	return rls;
};



/**  Game utility  **/
function reset(){
	gameList = [];
}

function getGame(gameId) {
	return _.find(gameList, function(x) { return x.id === gameId }) || undefined;
};

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

function getMaxPlayersPerGame() {
	return maxPlayers;
};

function getNameOfGame(gameId) {
	var game = getGame(gameId);
	if(game) {
		return game.name;
	}
	return null;
};

function gameCanStart(game) {
	if(game && !game.isStarted && game.players.length >= 3) {
		return true;
	}
	return false;
};

function canUserCreateGame(userId) {
	return typeof _.find(gameList, function(x) { return x.isOwner === userId && !x.isStarted }) === 'undefined';
};

function isPlayerPartOfGame(gameId, playerId) {
	var game = getGame(gameId);
	if(game) {
		return typeof _.find(game.players, function(x) { return x.id === playerId}) !== 'undefined';
	}
	return false;
};

function getPlayerOfGame(gameId, playerId) {
	var game = getGame(gameId);
	if(game) {
		return _.find(game.players, function(x) { return x.id === playerId});
	}
	return null;
};

function setPlayerAmount(gameId, amount) {
	var game = getGame(gameId);
	if(game) {
		game.playerAmount = amount;
	}
};

function getPlayerStates(game) {
	if(game) {
		var playerStates = [];

		for(var i=0; i<game.players.length; i++) {
			var playerId = game.players[i].id;
			if((gameCanStart(game) && game.players[i].id === game.isOwner) || 
				(game.isStarted && !game.players[i].hasSeenWinningRound)) {
				//Add more ifs

				playerStates.push({playerId: "active"});
			}else {
				playerStates.push({playerId: "passive"});
			}
		}
		return playerStates;
	}
	return null;
};


/** Game list utility **/
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

function listAllWithAllInfo() {
	return gameList;
};

function toInfo(fullGameList) {
	return _.map(fullGameList, function(game) {
		return { id: game.id, name: game.name, players: game.players.length};
	});
};

function toInfoWithStates(fullGameList) {
	return _.map(fullGameList, function(game) {
		return { id: game.id, name: game.name, players: game.players.length, playerStates: getPlayerStates(game) };
	});
};

function toInfoTimestamp(fullGameList) {
	return _.map(fullGameList, function(game) {
		return { id: game.id, name: game.name, isStarted: game.isStarted, createdAt: game.createdAt };
	});
};

function getFullGameListUserIsIn(userId) {
	var games = [];
	for(i=0; i<gameList.length; i++) {
		for(j=0; j<gameList[i].players.length; j++) {
			if(gameList[i].players[j].id === userId) games.push(gameList[i]);
		}
	}
	return games;
};

function getGamesUserIsIn(userId) {
	var games = [];
	for(i=0; i<gameList.length; i++) {
		for(j=0; j<gameList[i].players.length; j++) {
			if(gameList[i].players[j].id === userId) games.push(gameList[i]);
		}
	}
	return toInfoWithStates(games);
};

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

	return toInfo(_.filter(games, function(x) {
                return x.players.length < maxPlayers && !x.isStarted;
        }));
};

function getFullGameListForUser(userId) {
	var availableGames = [];
	var usersGames = [];
	var startedGames = 0;
	var userInGame = false;

	for(i=0; i<gameList.length; i++) {
		userInGame = false;
        for(j=0; j<gameList[i].players.length; j++) {
                if(gameList[i].players[j].id === userId) {
                	userInGame = true;
                }
        }
		if(userInGame) {
			usersGames.push(gameList[i]);
			if(gameList[i].isStarted) startedGames++;
		}else if(gameList[i].players.length < maxPlayers && !gameList[i].isStarted) {
			availableGames.push(gameList[i]);
		}else {
			startedGames++;
		}
    }

    availableGames = toInfoWithStates(availableGames);
    usersGames = toInfo(usersGames);

    return {ag: availableGames, ug: usersGames, sg: startedGames};

}


/**  Username functionality **/
function removeUser(user) {
	if(user) {
		removeFromArray(usernamesTaken, user);
		return user.name;
	}
	return null;
};

function checkIfNameTaken(username) {
	return  typeof _.find(usernamesTaken, function(x) { return x.name === username}) !== 'undefined';
};

function getUserOfId(userId) {
	return _.find(usernamesTaken, function(x) { return x.id === userId});
};

function addUsername(username, userId) {
	var existingUser = getUserOfId(userId);
	var games = getFullGameListUserIsIn(userId);
	console.log("Adding username " + username + " with id " + userId);
	if(existingUser && typeof existingUser !== 'undefined') {
		existingUser.name = username;
        for(i=0; i<games.length; i++) {
			for(j=0; j<games[i].players.length; j++) {
				if(games[i].players[j].id === userId) {
					games[i].players[j].name = username;
					break;
				}
			}
		}
    }else {
		usernamesTaken.push({name: username, id: userId});
	}
	return username;
};


/** Game functionality **/
function addGame(game) {
	if(game) {
		game.players = [];
		game.playerAmount = 8;
		game.isStarted = false;
		game.currentBlackCard = "";
		game.pointsToWin = 10;
		game.roundAmount = 0;
		game.history = [];
		game.chat = [];
		game.isOver = false;
		game.winningCardId = null;
		game.winnerId = null;
		game.chosenWhiteCards = [];
		game.reviewWhiteCards = [];
		game.isReadyForScoring = false;
		game.isReadyForReview = false;
		game.id = getRandomId();
		game.createdAt = new Date();

		gameList.push(game);
	}
	return game;
};

function joinGame(game, player) {
	if(game && player) {
		if(game.players.length >= maxPlayers) {
			return 'full game';
		}else if(isPlayerPartOfGame(game.id, player.id)) {
			return 'already in game';
		}
		
		//TODO change to use isPlayerPartOfGame
		if(typeof _.find(game.players, function(x) { return x.id === player.id}) === 'undefined') {
			var joiningPlayer = {
				id: player.id,
				name: player.name,
				isReady: false,
				hasSeenWinningRound: true,
				isReadyToSeeWinningCard: false,
				cards: [],
				selectedWhiteCardId: null,
				points: 0,
				isCzar: false,
				unreadMsg: false
			};

			if(game.chat.length > 0) {
				joiningPlayer.unreadMsg = true;
			}

			game.players.push(joiningPlayer);
		}

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
		if(leavingPlayer) {
			//Change next player to become czar if leaving player is czar
			for(i=0; i<game.players.length; i++) {
				if(game.players[i].id === leavingPlayer.id && game.players[i].isCzar) {
					game.players[(i+1)%game.players.length].isCzar = true;
					game.players[(i+1)%game.players.length].isReady = false;
					//Remove chosen card of newly chosen czar if they had one
					if(game.players[i+1]%game.players.length.selectedWhiteCardId) {
						removeFromArray(game.chosenWhiteCards, game.players[i].selectedWhiteCardId);
						(game.players[i+1]%game.players.length).selectedWhiteCardId = null;
					}
					break;
				}
			}

			//Check if the player had selected a card
			for(i=0; i<game.players.length; i++) {
				if(game.players[i].id === leavingPlayer.id && game.players[i].selectedWhiteCardId) {
					removeFromArray(game.chosenWhiteCards, game.players[i].selectedWhiteCardId);
					break;
				}
			}

			removeFromArray(game.players, leavingPlayer);
			if(game.players.length === 0) {
				removeFromArray(gameList, game);
			}else if(game.players.length === 2 && game.isStarted) {
				resetGame(gameId);
			}

			if(game.isStarted) {
				//Check if the player who left was the only one that had not chosen a card
				var readyPlayers = _.filter(game.players, function (x) {
					return x.selectedWhiteCardId;
				});
				if(readyPlayers.length === game.players.length-1) {
					game.isReadyForScoring = true;
					shuffle(game.chosenWhiteCards);
				}
			}

			if(game.isOwner === playerId && game.players.length > 0) {
				game.isOwner = game.players[0].id;
			}
		}
	}
};

function resetGame(gameId) {
    var game = getGame(gameId);
    if(game) {
        game.isStarted = false;
        game.createdAt = new Date();
        game.chosenWhiteCards = [];
        game.reviewWhiteCards = [];
		game.isOver = false;
        game.roundAmount = 0;
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
	if(game) {
		game.winnerId = null;
		game.winningCardId = null;
		game.isReadyForScoring = false;
		game.isReadyForReview = false;
		game.reviewWhiteCards = game.chosenWhiteCards;
		game.chosenWhiteCards = [];

		if(game.deck.black.length == 0 || game.deck.white.length <= 8) {
			console.log(game.name + " is out of cards. Fetching new deck list.");
			game.deck = getDeck(["Base"]);
		}

		setCurrentBlackCard(game);

		_.each(game.players, function(player) {
			if(!player.isCzar) {
				removeFromArray(player.cards, player.selectedWhiteCardId);
				drawWhiteCard(game, player);
			}

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
};

function drawWhiteCard(game, player) {
	if(game && player) {
		var whiteIndex = Math.floor(Math.random() * game.deck.white.length);
		player.cards.push(game.deck.white[whiteIndex]);
		game.deck.white.splice(whiteIndex, 1);
	}
};

function setCurrentBlackCard(game) {
	if(game) {
		var index = Math.floor(Math.random() * game.deck.black.length);
		game.currentBlackCard = game.deck.black[index];
		game.deck.black.splice(index, 1);
	}
};


function getPlayerByCardId(gameId, cardId) {
	var game = getGame(gameId);
	if(game) {
		return _.findWhere(game.players, { selectedWhiteCardId: cardId });
	}
	return null;
};

function selectCard(gameId, playerId, card) {
	var player = getPlayerOfGame(gameId, playerId);
	if(player && !player.selectedWhiteCardId) {
		player.selectedWhiteCardId = card;
		player.isReady = false;
		var game = getGame(gameId);
		if(game) {
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
};

function sawWinningRound(gameId, playerId) {
	var player = getPlayerOfGame(gameId, playerId);
	if(player) {
		player.hasSeenWinningRound = true;
		player.isReadyToSeeWinningCard = false;
	}
};

function selectWinner(gameId, cardId) {
	var player = getPlayerByCardId(gameId, cardId);
	var game = getGame(gameId);
	if(game && player) {
		game.winningCardId = cardId;
		game.isReadyForReview = true;
		player.points = player.points + 1;
		game.roundAmount++;

		if(game.roundAmount == 1 && game.history.length > 0) {
			game.winnerId = null;
			game.history = [];
		}

		game.history.push({ black: game.currentBlackCard, white: cardId, winner: player.name });

		for(i=0; i<game.players.length; i++) {
			game.players[i].hasSeenWinningRound = false;
			game.players[i].isReadyToSeeWinningCard = true;
		}

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
	return null;
};


/**  Chat functionality **/
function addChatMsgToGame(gameId, senderId, msgReceived) {
	var game = getGame(gameId);
	var user = getUserOfId(senderId);
	var newMsg = null;
	if(game && user) {
		//Remove first item in array if there are more than 20 messages
		if(game.chat.length >= 20) {
			game.chat.shift();
		}
		newMsg = { sender: user.name, msg: msgReceived};
		game.chat.push(newMsg);

		for(var i=0; i<game.players.length; i++) {
			game.players[i].unreadMsg = true;
		}

		return game.chat;
	}
	return null;
};

function seenLastMsgInGame(gameId, playerId) {
	var game = getGame(gameId);
	var user = getPlayerOfGame(gameId, playerId);
	if(game && user) {
		user.unreadMsg = false;
	}
};



exports.getExpansions = getExpansions;
exports.addUsername = addUsername;
exports.removeUser = removeUser;
exports.getUserOfId = getUserOfId;
exports.getNameOfGame = getNameOfGame;
exports.checkIfNameTaken = checkIfNameTaken;
exports.getGamesUserIsIn = getGamesUserIsIn;
exports.getFullGameListForUser = getFullGameListForUser;
exports.listAllWithAllInfo = listAllWithAllInfo;
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
exports.reset = reset;
exports.endRound = endRound;
exports.selectCard = selectCard;
exports.sawWinningRound = sawWinningRound;
exports.selectWinner = selectWinner;
exports.addChatMsgToGame = addChatMsgToGame;
exports.seenLastMsgInGame = seenLastMsgInGame;
exports.setPlayerAmount = setPlayerAmount;
