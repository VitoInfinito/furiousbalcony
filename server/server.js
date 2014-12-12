var express = require('express');
var app = express();
var server = app.listen(10600, function() {
        var host = server.address().address;
        var port = server.address().port;
        console.log('Furious Balcony Server running at http://%s:%s', host, port);
});
var bodyParser = require('body-parser');
var Connections = require('./connections.js');
var io = require('socket.io').listen(server);
var socketCount = 0;
var Game = require('./game.js');
var players = {};

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
	}
	return viewModel;
}

function delayEndRound(gameId) {
        setTimeout(function() {Game.endRound(Game.getGame(gameId)); broadcastGame(gameId);}, 10000);
}


io.sockets.on('connection', function(socket) {
	socketCount += 1;
	console.log('User connect, socketcount: ' + socketCount);
	socket.join('lobbyRoom');

	socket.on('connectToGame', function(data) {
		var game = Game.getGame(data.gameId);
		if(game) {
			if(socket.gameId != game.id) {
				console.log('User connecting to game with id ' + data.gameId);
				//socket.leave('lobbyRoom');
				//console.log("got in anyway");
				socket.join(data.gameId);
				socket.gameId = game.id;
				//broadcastGame(data.gameId);
			}else {
						
			}
			broadcastGame(data.gameId);
		} else {
			//console.log("before error");
			//TODO fix error emits
			//socket.emit('error', 'Invalid Game ID');
			//console.log("after error");
		}
	});

	socket.on('joinLobby', function() {
		console.log("User joined lobby");
		socket.join('lobbyRoom');
	});

	socket.on('addUserInformation', function(data) {
		socket.userId = data.userId;
		socket.userName = data.userName;
	});

	socket.on('disconnect', function() {
		socketCount -= 1;
		console.log('User disconnect, socketcount: ' + socketCount);
		if(socket.playerId && socket.gameId) {
			console.log('socket disconnect ' + socket.playerId);
			delete players[socket.gameId][socket.playerId];
			Game.departGame(socket.gameId, socket.playerId);
			lobbySocket.emit('gameAdded', Game.list());
		}

		if(socket.userId && socket.userName) {
			var games = Game.getGamesUserIsIn(socket.userId);
			for(i=0; i<games.length; i++) {
				Game.leaveGame(games[i], socket.userId);
			}
			io.to('lobbyRoom').emit('gameAdded', Game.list());
			Game.removeUsername(socket.userName);
		}


	});
});
		
app.get('/list', function(req, res) { ;res.json(Game.list()); });
app.get('/checkConnection', function(req, res) { res.send("ok")});
app.get('/checkName', function(req, res) {	
	if(!Game.checkIfNameTaken(req.query.name)) {
		Game.addUsername(req.query.name, req.query.id);
		var games = Game.getGamesUserIsIn(req.query.id);
		for(i=0; i<games.length; i++) {
			broadcastGame(games[i].id);
		}
		res.send('free');
	}else {
		res.send("taken")
	}
});

app.post('/addGame', function(req, res) {
	var newGame = Game.addGame(req.body);
	res.json(newGame);
	//lobbySocket.emit('gameAdded', Game.list());
	io.to('lobbyRoom').emit('gameAdded', Game.list());
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

	game = Game.joinGame(game, { id: req.body.playerId, name: req.body.playerName });

	returnGame(req.body.gameId, res);
	//lobbySocket.emit('gameAdded', Game.list());
	io.to('lobbyRoom').emit('gameAdded', Game.list());
	broadcastGame(req.body.gameId);
});

app.post('/leavegame', function(req, res) {
	Game.leaveGame(req.body.gameId, req.body.playerId);
	//lobbySocket.emit('gameAdded', Game.list());
	io.to('lobbyRoom').emit('gameAdded', Game.list());
	broadcastGame(req.body.gameId);
});

app.post('/selectCard', function(req, res) {
	Game.selectCard(req.body.gameId, req.body.playerId, req.body.card);
	broadcastGame(req.body.gameId);
	returnGame(req.body.gameId, res);
});

app.post('/selectWinningCard', function(req, res) {
	Game.selectWinner(req.body.gameId, req.body.card);
	broadcastGame(req.body.gameId);
	delayEndRound(req.body.gameId);
	returnGame(req.body.gameId, res);
});

app.post('/ready', function(req, res) {
//	Game.readyForNextRound(req.body.gameId, req.body.playerId);
	broadcastGame(req.body.gameId);
	returnGame(req.body.gameId, res);
});

app.post('/startGame', function(req, res) {
	Game.startGame(req.body.gameId);
	broadcastGame(req.body.gameId);
	returnGame(req.body.gameId, res);
});
