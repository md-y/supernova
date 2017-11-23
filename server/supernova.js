var server = require("http").createServer(reqHandler),
io = require("socket.io")(server),
events = require("./events.js").events,
fs = require("fs"),
cfg = require("./config.json"),
players = {},
gameState = 0, //0 = Stopped; 1 = Running
gameLoop;

server.listen(process.env.PORT || cfg.port);

function reqHandler(req, res) {
    switch(req.url.split('?')[0]) {
    case "/events":
        fs.readFile(__dirname +  "/events.js", function(err, data) {
            if(err) {
                res.writeHead(500);
                console.log("Unable to load events.js \n" + err);
                res.end();
                return;
            }
            res.writeHead(200);
            res.end(data);
        });
    break;
    case "/players":
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        var total = Object.keys(players).length;
        res.end(JSON.stringify({
            total: total,
            print: total + " player(s)"
        }));
    break;
    default:
        res.writeHead(302, {"Location": "https://midymyth.github.io/supernova"});
        res.end();
    break;
    }
}



class Player {
    constructor(username_, id_, color_, index_) {
        this.username = username_;
        this.id = id_;
        this.index = index_;
        this.health = 100;
        this.sp = 0;
        this.color = color_;
        this.lastPing = new Date().getTime();
        do {
            var cont = false;
            this.x = Math.floor(Math.random() * cfg.boardSize);
            this.y = Math.floor(Math.random() * cfg.boardSize);
            for (let i in players) {
                if (Math.abs(players[i].x - this.x) < cfg.boardSize/10 && Math.abs(players[i].y - this.y) < cfg.boardSize/10) {
                    cont = true;
                }
            }
        } while (cont);
    }
}

io.on("connection", function(soc) {
    console.log("New connection on socket", soc.id);
    soc.join("game");
    soc.on("event", function(data) {
        try {
            var event = events[data.type];
            var meta = {players: players, 
                        soc: soc,
                        Player: Player,
                        cfg: cfg,
                        io: io};

            if ("exec" in event) {
                event.exec(data);
            }
            if ("server" in event) {
                event.server(data, meta);
            }
        } catch (err) {
            console.log("Unable to execute event\n" + err);
        }
    });
    soc.on("disconnect", function(data){disconnect(soc.id)});
    if (gameState == 0) {
        gameState = 1;
        console.log("Game Started");
        gameLoop = setInterval(turn, 5000);
    }
    console.log(soc.handshake.headers.host);
});

function disconnect(id) {
    if(id in players) {
        io.in("game").emit("event", {type: "playerDisconnect", player: players[id]});
        console.log("Player " + players[id].username + " (" + id + ") has disconnected.");
        delete players[id];
    }
    if (id in io.sockets.connected) {
        io.sockets.connected[id].disconnect();
    }
    if (Object.keys(players).length == 0) {
        gameState = 0;
        clearInterval(gameLoop);
        console.log("Game stopped.");
    }
}

function turn() {
    var time = new Date().getTime();
    for (let i in players) {
        if (time - players[i].lastPing > 10000) {
            disconnect(i);
            console.log("Player " + players[i].username + " (" + i + ") has been timed out.");
        }
    }
    io.in("game").emit("event", {type: "turn", players: players});
}