var soc, self, drawFrame, bd, bde, width, height, players, mobile,
mouseDown = false,
mouseX = 0, mouseY = 0, pmouseX = 0; pmouseY = 0, 
cameraX = 0, cameraY = 0, cameraView = 25, viewScale = 50, viewScaleVert = 25, //Viewscale = # of viewed tiles on the X axis
tilesSR = 100, tileSize = 38;
args = {},
frameRate = 30,
downKeys = {
    allUp: function() {
        var keys = Object.keys(this);
        for (var i = 1; i < keys.length; i++) { //1 to avoid this function
            this[keys[i]] = false;
        }
    }
};

window.onload = function() {
    args.server = window.atob(getKey(location.href, "server", "aHR0cDovL2xvY2FsaG9zdA=="));
    args.username = window.atob(getKey(location.href, "name", "amVmZg=="));
    args.color = getKey(location.href, "color", "#ffffff");

    var eventsElement = document.createElement("script"); //Import events.js
    eventsElement.src = args.server + "/events";
    eventsElement.type = "text/javascript";
    document.getElementById("head").appendChild(eventsElement);

    setupSocket(); //Connects to server

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

function getKey(s, k, d) {
    try {
        return s.match("[?]" + k + "=([^?]+)")[1];
    } catch (err) {
        console.log("Cannot find " + k + ", using " + d)
        return d;
    }
}

function setupSocket () {
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

function debug(de, pass, args) {
    soc.emit("event", {type: "debug", de: de, pass: pass});
}

function draw() {
    viewScaleVert = height/(width/viewScale);
    tileSize = width/viewScale;

    //Camera
    if (mouseDown) {
        cameraX += (mouseX - pmouseX) / tileSize;
        cameraY += (mouseY - pmouseY) / tileSize;
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
    cameraX = cameraX < 0 ? 0 : cameraX;
    cameraX = cameraX + viewScale > tilesSR ? tilesSR - viewScale : cameraX;
    cameraY = cameraY < 0 ? 0 : cameraY;
    cameraY = cameraY + viewScaleVert > tilesSR ? tilesSR - viewScaleVert : cameraY;
    viewScale = viewScale < 1 ? 1 : viewScale;
    viewScale = viewScale > tilesSR ? tilesSR : viewScale;

    bd.clearRect(0, 0, width, height);
    var partY;
    for (var y = 0; y <= viewScaleVert + 1; y++) {
        partY = 1 - cameraY % 1;
        for (var x = 0; x <= viewScale; x++) {
            bd.fillStyle = "gray";
            bd.fillRect((x - (1 - cameraX % 1)) * tileSize, (y - partY) * tileSize, tileSize - 1, tileSize - 1);
        }
    }

    //Draw Horizontal View Bar
    bd.fillStyle = "black";
    bd.fillRect(0, height - 25, (width - 25), 25);
    bd.fillStyle = "red";
    bd.fillRect((width - 25) * cameraX / tilesSR, height - 25, viewScale * (width - 25) / tilesSR, 25);

    //Draw Vertical View Bar
    bd.fillStyle = "black";
    bd.fillRect(width - 25, 0, 25, (height - 25));
    bd.fillStyle = "red";
    bd.fillRect(width - 25, (height - 25) * cameraY / tilesSR, 25, viewScaleVert * (height - 25) / tilesSR);

    //Update Previous Mouse Location
    pmouseX = mouseX; 
    pmouseY = mouseY; 
}