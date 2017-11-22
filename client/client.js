var soc, drawFrame, bd, bde, width, height, 
players = {}, playerList, player = {},
mouseDown = false,
mouseX = 0, mouseY = 0, pmouseX = 0; pmouseY = 0, gmouseX = 0, gmouseY = 0, //pmouse = mouse pos on the previous frame; gmouse = global mouse pos
cameraX = 0, cameraY = 0, cameraView = 25, viewScale = 50, viewScaleVert = 25, //Viewscale = # of viewed tiles on the X axis
tilesSR = 100, tileSize = 38;
args = {},
frameRate = 30,
downKeys = {
    allUp: function() {
        for (let i in downKeys) { //1 to avoid this function
            if (i != "allUp") {
                downKeys[i] = false;
            }
        }
    }
};

window.onload = function() {
    args.server = window.atob(getKey(location.href, "server", "aHR0cDovL2xvY2FsaG9zdA=="));
    args.username = window.atob(getKey(location.href, "name", "amVmZg=="));
    args.color = getKey(location.href, "color", "#ffffff").split("#")[1];
    args.color = (  parseInt(args.color.substring(0, 2), 16) +
                    parseInt(args.color.substring(2, 4), 16) +
                    parseInt(args.color.substring(4, 6), 16)) / 3 > 200 ? "#c8c8c8" : '#' + args.color; //Remove colors above grayscale 200

    var eventsElement = document.createElement("script"); //Import events.js
    eventsElement.src = args.server + (args.server[args.server.length - 1] == '/' ? "events" : "/events");
    eventsElement.type = "text/javascript";
    eventsElement.onload = function() {
        document.getElementById("statusHeading").style.display = "none";

        console.log("events.js loaded, connecting to server")
        soc = io(args.server); //Connects to server

        soc.on("event", function(data) {
            var event = events[data.type];

            if ("exec" in event) {
                event.exec(data);
            }
            if ("client" in event) {
                event.client(data);
            }
        });

        soc.emit("event", { type: "newPlayer", 
                            username: args.username, 
                            color: args.color
                            });
    }
    eventsElement.onerror = function() {
        var h = document.getElementById("statusHeading");
        h.innerHTML = "Could not connect to server. Please try again.";
        alert(h.innerHTML)
        h.style.color = "red";
    }
    document.getElementById("head").appendChild(eventsElement);
    playerList = document.getElementById("playerList");

    bde = document.getElementById("board"); //Setup Canvas ("board")
    var resetDimensions = function() {
        width = window.innerWidth;
        height = window.innerHeight;
        bde.width = width;
        bde.height = height;
        viewScale = 50;
    }
    window.addEventListener("resize", resetDimensions);
    window.addEventListener("orientationchange", resetDimensions);
    resetDimensions();
    bd = bde.getContext("2d");

    drawFrame = setInterval(draw, 1000/frameRate);
}

function debug(de, pass, args) {
    soc.emit("event", {type: "debug", de: de, pass: pass});
}

function draw() {
    viewScaleVert = height/(width/viewScale);
    tileSize = width/viewScale;

    //Camera
    if (mouseDown) {
        cameraX -= (mouseX - pmouseX) / tileSize;
        cameraY -= (mouseY - pmouseY) / tileSize;
    }
    if (downKeys["ArrowUp"]) {
        cameraY -= 25/tileSize;
    }
    if (downKeys["ArrowDown"]) {
        cameraY += 25/tileSize;
    }
    if (downKeys["ArrowLeft"]) {
        cameraX -= 25/tileSize;
    }
    if (downKeys["ArrowRight"]) {
        cameraX += 25/tileSize;
    }
    if (downKeys[" "]) {
        viewScale += 1;
    }
    if (downKeys["Enter"]) {
        viewScale -= 1;
    }
    cameraX = cameraX < 0 ? 0 : cameraX; //Set min
    cameraX = cameraX + viewScale > tilesSR ? tilesSR - viewScale : cameraX; //Set max
    cameraY = cameraY < 0 ? 0 : cameraY; //Set min
    cameraY = cameraY + viewScaleVert > tilesSR ? tilesSR - viewScaleVert : cameraY; //Set max
    viewScale = viewScale < 1 ? 1 : viewScale; //Set min
    viewScale = viewScale > tilesSR ? tilesSR : viewScale; //Set max
    var partY = cameraY % 1;
    var partX = cameraX % 1;

    gmouseX = mouseX/tileSize + cameraX + partX;
    gmouseY = mouseY/tileSize + cameraY + partY;

    bd.clearRect(0, 0, width, height);
    var rx, ry, grayscale;
    for (var y = 0; y <= viewScaleVert + 1; y++) { //Draw Grid
        ry = Math.floor(cameraY) + y;
        for (var x = 0; x <= viewScale; x++) {
            rx = Math.floor(cameraX) + x;
            grayscale = x * y;
            bd.fillStyle = "white";
            for (let i in players) {
                if (rx == players[i].x && ry == players[i].y) {
                    bd.fillStyle = players[i].color;
                }
            }
            if (Math.floor(gmouseX - cameraX) == x && Math.floor(gmouseY - cameraY) == y) {
                bd.fillStyle = "#c0c0c0";
            }

            bd.fillRect((x - partX) * tileSize, (y - partY) * tileSize, tileSize - 1, tileSize - 1); //Draw Tile
        }
    }

    
    bd.fillStyle = "#808080";
    bd.fillRect(0, height - 25, (width - 25), 25); //Draw Horizontal View Bar Background
    bd.fillRect(width - 25, 0, 25, (height - 25)); //Vertical
    bd.fillStyle = "#b0b0b0";
    bd.fillRect((width - 25) * cameraX / tilesSR, height - 25, viewScale * (width - 25) / tilesSR, 25); //Draw Horizontal View Bar Foreground
    bd.fillRect(width - 25, (height - 25) * cameraY / tilesSR, 25, viewScaleVert * (height - 25) / tilesSR); //Vertical

    //Update Previous Mouse Location
    pmouseX = mouseX; 
    pmouseY = mouseY; 
}