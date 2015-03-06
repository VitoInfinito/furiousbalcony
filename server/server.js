var express = require('express');
var app = express();
var server = app.listen(10600, function() {
        var host = server.address().address;
        var port = server.address().port;
        console.log('Icy Balcony Server running at http://%s:%s', host, port);
});
var bodyParser = require('body-parser');
var io = require('socket.io').listen(server);
var socketCount = 0;
var Game = require('./game.js');
var players = {};
var version = 4;
var versionMessage = "Please download the latest updates for a better experience.";
var outdatedMessage = "You have to download the latest updates to be able to continue.";
var motd = "DISCLAIMER: Due to lack of servers we can currently not assure that a connection to a server can always be established. Server restarts and resets may occur daily.";
var versionNoExist = "This version either does not exist or is not supported by this server.";

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(allowCrossDomain);

function returnGame(gameId, res) { res.json(gameViewModel(gameId)); };

function broadcastGame(gameId) {
	if(gameId) {
		var vm = gameViewModel(gameId);
		if(vm) io.to(gameId).emit('updateGame', vm);
	}
};

function gameViewModel(gameId) {
	var game = Game.getGame(gameId);
	var viewModel = null;
	if(game) {
		viewModel = JSON.parse(JSON.stringify(game));
		delete viewModel.deck;
		delete viewModel.createdAt;
	}
	return viewModel;
};

/*function delayEndRound(gameId) {
        setTimeout(function() {Game.endRound(Game.getGame(gameId)); broadcastGame(gameId);}, 10);
};*/

function checkIfGamesAreAbandoned(timeoutTime) {
	
	var currentTime = new Date();
	console.log("Checking for abandoned games at time " + currentTime);
	var games = Game.listTimestamp();

	if(games)
		console.log("The gamelist contains " + games.length + " games");

	for(i=0; i<games.length; i++) {
		if(games[i].createdAt.getTime() + timeoutTime < currentTime.getTime() && !games[i].isStarted) {
			console.log('*')
			console.log(games[i].name + " was created at " + games[i].createdAt + " and is now considered abandoned. Shutting game down");
			console.log('* ' + i)
			kickAllPlayersInGameWithId(games[i].id);
		}
	}

	io.to('lobbyRoom').emit('gameAdded', Game.list());

	setTimeout(function() { checkIfGamesAreAbandoned(timeoutTime) }, timeoutTime);

};

function kickAllPlayersInGameWithId(gameId) {
	var game = Game.getGame(gameId);
	if(game) {
		var players = [];
		//Creating list with users in order to kick everyone without bugs
		for(i=0; i<game.players.length; i++) {
			players.push(game.players[i].id);
		}

		for(j=0; j<players.length; j++) {
			Game.leaveGame(game.id, players[j]);
			io.to(game.id).emit('kickPlayer', { kickedPlayer : players[j], game: gameViewModel(game.id) });
		}

		io.to('lobbyRoom').emit('gameAdded', Game.list());
}
};

function initServer() {
	checkIfGamesAreAbandoned(360000);
};


io.sockets.on('connection', function(socket) {
	socketCount += 1;
	console.log('User connect, socketcount: ' + socketCount);
	socket.join('lobbyRoom');

	socket.on('connectToGame', function(data) {
		var game = Game.getGame(data.gameId);
		if(game) {
 			if(socket.gameId != game.id) {
				//if(socket.userName)
					//console.log('User ' + socket.userName + ' is connecting to ' + Game.getNameOfGame(data.gameId));
				//Making sure user only gets updates from one game at a time by leaving possible other games user was in.
				socket.leave(socket.gameId);
				socket.join(data.gameId);
				socket.gameId = game.id;
				//broadcastGame(data.gameId);
			}
			broadcastGame(data.gameId);
		}
	});

	socket.on('joinLobby', function() {
		//console.log("User joined lobby");
		socket.join('lobbyRoom');
	});

	socket.on('addUserInformation', function(data) {
		socket.userId = data.userId;
		socket.userName = data.userName;
		socket.clientVersion = data.clientVersion;
	});

	socket.on('kickPlayer', function(data) {
		//Add more checks for if user that is kicking is the owner of the game
		var user = Game.getUserOfId(data.playerId);
		if(user) console.log("Kicking " + user.name + " from " + Game.getNameOfGame(data.gameId));
		Game.leaveGame(data.gameId, data.playerId);
		io.to(data.gameId).emit('kickPlayer', { kickedPlayer : data.playerId, game: gameViewModel(data.gameId) });
	});

	socket.on('sendMsgToRoom', function(data) {
		if(data.gameId && data.playerId) {
			var msgs = Game.addChatMsgToGame(data.gameId, data.playerId, data.chatMsg)
			if(msgs) io.to(data.gameId).emit('receivedMsg', msgs);
		}
	});

	socket.on('seenLastMsg', function(data) {
		if(data.gameId && data.playerId) {
			Game.seenLastMsgInGame(data.gameId, data.playerId);
		}
	});

	socket.on('disconnect', function() {
		socketCount -= 1;
		console.log('User disconnect, socketcount: ' + socketCount);
		if(socket.playerId && socket.gameId) {
			console.log('socket disconnect ' + socket.playerId);
			//delete players[socket.gameId][socket.playerId];
			//Game.departGame(socket.gameId, socket.playerId);
			//lobbySocket.emit('gameAdded', Game.list());
		}

		/*if(socket.userId && socket.userName) {
			var games = Game.getGamesUserIsIn(socket.userId);
			for(i=0; i<games.length; i++) {
				Game.leaveGame(games[i], socket.userId);
			}
			io.to('lobbyRoom').emit('gameAdded', Game.list());
			Game.removeUsername(socket.userName);
		}*/


	});
});
		
app.get('/list', function(req, res) { res.json(Game.list()); });
app.get('/fullList', function(req, res) { res.json(Game.listAllWithAllInfo()); });
app.get('/listExpansions', function(req, res) { res.json(Game.getExpansions()); });
app.get('/listusersgames', function(req, res) { res.json(Game.getGamesUserIsIn(req.query.id)); });
app.get('/listavailablegames', function(req, res) { res.json(Game.getAvailableGamesForUser(req.query.id)); });
app.get('/listgamesandinfo', function(req, res) { 
	/*var ug = Game.getGamesUserIsIn(req.query.id));
	var ag = Game.getAvailableGamesForUser(req.query.id));*/
	var gameListInfo = Game.getFullGameListForUser(req.query.id);
	if(!isNaN(req.query.version) && parseInt(req.query.version) === version) {
		res.json({usersGames: gameListInfo.ug, availableGames: gameListInfo.ag, connectedUsers: socketCount, startedGames: gameListInfo.sg}); 
	}else {
		res.json("please dont"); 
	}
	
});

app.get('/checkConnection', function(req, res) { 
	if(req.query.version) {	
		if(isNaN(req.query.version) || parseInt(req.query.version) > version) {
			res.json({message: versionNoExist, code: '404'});
		}else if(parseInt(req.query.version) === version){
			res.json({message: motd, code: '200'});
		}else if(parseInt(req.query.version) < version) {
			res.json({message: versionMessage, code: '202'});
		}else {
			res.send("Something went wrong when contacting the server");
		}
	}else {
		res.send(outdatedMessage);
	}

	
	

});
app.get('/checkName', function(req, res) {	
	if(!Game.checkIfNameTaken(req.query.name)) {
		Game.addUsername(req.query.name, req.query.id);
		var games = Game.getGamesUserIsIn(req.query.id);
		for(i=0; i<games.length; i++) {
			broadcastGame(games[i].id);
		}
		res.send('free');
	}else {
		res.send('taken');
	}
});

app.get('/getuserofid', function(req, res) {
	var user = Game.getUserOfId(req.query.id);
	if(user) {
		res.send(user);
	}else {
		res.send('noexist');
	}
});

app.post('/addGame', function(req, res) {
	if(Game.canUserCreateGame(req.body.isOwner)) {
		var newGame = Game.addGame(req.body);
		res.json(newGame);
		io.to('lobbyRoom').emit('gameAdded', Game.list());
	}else {
		res.send('not allowed');
	}
});

app.get('/getgamebyid', function(req, res) { returnGame(req.query.id, res); });

app.post('/joingame', function(req, res) {
	var game = Game.getGame(req.body.gameId);
	if(!game) {
		res.writeHead(500, { 'Content-Type': 'application/json' });
		res.write(JSON.stringify({ error: 'invalid GameId' }));
		res.end();
		return null;
	}

	if((game.isStarted || game.players.length >= Game.getMaxPlayersPerGame) && !Game.isPlayerPartOfGame(req.body.gameId, req.body.playerId)) {
		res.writeHead(500, { 'Content-Type': 'application/json' });
		res.write(JSON.stringify({ error: "too many players" }));
		res.end();
		return null;
	}

	var user = Game.getUserOfId(req.body.playerId);
	if(user) 
		console.log('User ' + user.name + ' is joining ' + game.name);
	
	game = Game.joinGame(game, { id: req.body.playerId, name: req.body.playerName });

	returnGame(req.body.gameId, res);
	io.to('lobbyRoom').emit('gameAdded', Game.list());
	//broadcastGame(req.body.gameId);
});

app.post('/leavegame', function(req, res) {
	var user = Game.getUserOfId(req.body.playerId);
	if(user)
		console.log(user.name + " is leaving " + Game.getNameOfGame(req.body.gameId));
	Game.leaveGame(req.body.gameId, req.body.playerId);
	//lobbySocket.emit('gameAdded', Game.list());
	io.to('lobbyRoom').emit('gameAdded', Game.list());
	broadcastGame(req.body.gameId);
	res.json(Game.getGamesUserIsIn(req.body.playerId));
});

app.post('/selectCard', function(req, res) {
	Game.selectCard(req.body.gameId, req.body.playerId, req.body.card);
	broadcastGame(req.body.gameId);
	returnGame(req.body.gameId, res);
});

app.post('/selectWinningCard', function(req, res) {
	var continueGame = Game.selectWinner(req.body.gameId, req.body.card);
	broadcastGame(req.body.gameId);
	if(continueGame) {
		//delayEndRound(req.body.gameId);
		Game.endRound(Game.getGame(req.body.gameId));
		broadcastGame(req.body.gameId);
	}else {
		console.log(Game.getNameOfGame(req.body.gameId) + " is over");
	}
	returnGame(req.body.gameId, res);
});

app.post('/ready', function(req, res) {
//	Game.readyForNextRound(req.body.gameId, req.body.playerId);
	broadcastGame(req.body.gameId);
	returnGame(req.body.gameId, res);
});

app.post('/sawWinningRound', function(req, res) {
	Game.sawWinningRound(req.body.gameId, req.body.playerId);
	//console.log(Game.getUserOfId(req.body.playerId).name);
	//broadcastGame(req.body.gameId);
	returnGame(req.body.gameId, res);
});

app.post('/startGame', function(req, res) {
	console.log(Game.getNameOfGame(req.body.gameId) + " is starting");
	Game.startGame(req.body.gameId, req.body.expList);
	broadcastGame(req.body.gameId);
	returnGame(req.body.gameId, res);
});

initServer();
