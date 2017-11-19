var server = require("http").createServer(reqHandler);
var io = require("socket.io")(server);
var events = require("./events.js").events;
var fs = require("fs");
var players = [];

server.listen(80);

function reqHandler(req, res) {
    if (req.url.split('?')[0] == "/events") {
        res.writeHead(200);
        fs.readFile(__dirname +  "/events.js", function(err, data) {
            if(err) {
                res.writeHead(500);
                console.log("Unable to load events.js \n" + err);
                res.end();
                return;
            }
            res.end(data);
        });
    } else {
        res.writeHead(302, {"Location": "https://midymyth.github.io/supernova"});
        res.end();
    }
}

class Player {
    constructor(username_, id_, color_) {
        this.username = username_;
        this.id = id_;

        this.health = 100;
        this.sp = 0;
        this.x = players.length + 10;
        this.y = players.length + 10;
        this.color = color_;
    }
}

io.on("connection", function(soc) {
    console.log("New connection on socket", soc.id);
    soc.join("game");
    soc.on("event", function(data) {
        var event = events[data.type];
        var meta = {players: players, 
                    soc: soc,
                    Player: Player,
                    pass: "admin",
                    io: io};

        if ("exec" in event) {
            event.exec(data);
        }
        if ("server" in event) {
            event.server(data, meta);
        }
    });
});