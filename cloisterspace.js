//
// Simple Carcassonne Random Map Generator
// Copyright 2011 Maciej Adwent
//

var EDGE_TYPE_CITY = "city";
var EDGE_TYPE_GRASS = "grass";
var EDGE_TYPE_ROAD = "road";


var edgeDefs = {
    "r":EDGE_TYPE_ROAD,
    "g":EDGE_TYPE_GRASS,
    "c":EDGE_TYPE_CITY
};


var Tile = function(imageName, north, east, south, west, hasTwoCities, hasRoadEnd){
    var rotation = 0;
    var rotationClass = "";

    var turnedEdge = function(dir){
        // return which edge we would be reading from IF the tile
        // were to be rotated once clockwise
        return ({
            east: "north",
            south: "east",
            west: "south",
            north: "west"
        })[dir];
    };

    return {
        edges: {
            north: north,
            east: east,
            west: west,
            south: south
        },

        hasRoadEnd: hasRoadEnd,

        getImage: function(){
            return imageName;
        },

        getRotation: function(){
            return rotation;
        },

        getRotationClass: function(){
            return rotationClass;
        },

        rotate: function(turns){
            if(turns == 0){
                rotation = 0;
                rotationClass = "";
                return;
            }
            if(turns == 1 || turns==2 || turns==3) {
                rotation = turns;
                rotationClass = "r" + turns;
            } else {
                throw "invalid rotation";
            }

            for(var i = 0; i < turns; i++){
                //
                // shuffle the edges clockwise
                //
                var n = this.edges.north;
                var e = this.edges.east;
                var s = this.edges.south;
                var w = this.edges.west;
                this.edges.east = n;
                this.edges.south = e;
                this.edges.west = s;
                this.edges.north = w;
            }
        },

        connectableTo: function(inDirection, otherTile, turns){
            //
            // does otherTile match this tile at connecting edge of inDirection?
            //
            var dir = inDirection;
            if(turns > 0){
                for(var i = 0; i < turns; i++){
                    dir = turnedEdge(dir);
                }
            }
            //
            // consider this potentially-rotated edge @ dir against some placed edge
            //
            var thisEdge = this.edges[dir];
            var otherEdge = otherTile.edges[{
                north:"south",
                east:"west",
                south:"north",
                west:"east"
            }[inDirection]];
            return thisEdge.edge === otherEdge.edge;
        },

        toJSON: function(){
            return JSON.stringify({
                imageName: imageName,
                north: this.edges.north,
                south: this.edges.south,
                west: this.edges.west,
                east: this.edges.east,
                hasTwoCities: hasTwoCities,
                hasRoadEnd: hasRoadEnd
            });
        },



        getCities: function() {
            console.debug(_([this.edges.north.city,this.edges.east.city,this.edges.west.city,this.edges.south.city]).chain().flatten().unique().reject(function(i) { return i == "-";}).value());
        }

    };
};


function generateRandomWorld(){
    // Warning: big ugly function ahead. Split up for fun and profit

    var startTime = (new Date()).getTime();

    var tiles = [];

    var tileDefinitions = _([
        //
        // order of edge specs is NESW
        //
        // More edge details:
        // RoadMap (order NESW),
        // CityMap (order NESW),
        // GrassMap (clockwise-order starting from top-edge on the left side. Or in compass notation: NNW,NNE,ENE,ESE,SSE,SSW,WSW,WNW)
        //

        "city4.png      1   reg   cccc    --  ----    1111    --------",
        "road4.png      1   reg   rrrr    --  1234    ----    12233441",
        "city3.png      3   reg   ccgc    --  ----    11-1    ----11--",

        "city3s.png     1   reg   ccgc    --  ----    11-1    ----11--",
        "city3r.png     1   reg   ccrc    --  --1-    11-1    ----12--",
        "city3sr.png    2   reg   ccrc    --  --1-    11-1    ----12--",
        "road3.png      4   reg   grrr    --  -123    ----    11122331",
        "city2we.png    1   reg   gcgc    --  ----    -1-1    11--22--",
        "city2wes.png   2   reg   gcgc    --  ----    -1-1    11--22--",
        "road2ns.png    8   reg   rgrg    --  1-1-    ----    12222111",
        "city2nw.png    3   reg   cggc    --  ----    1--1    --1111--",

        "city2nws.png   2   reg   cggc    --  ----    1--1    --1111--",
        "city2nwr.png   3   reg   crrc    --  -11-    1--1    --1221--",

        "city2nwsr.png  2   reg   crrc    --  -11-    1--1    --1221--",

        "road2sw.png    9   reg   ggrr    --  --11    ----    11111221",

        "city11ne.png   2   reg   ccgg    11  ----    12--    ----1111",
        "city11we.png   3   reg   gcgc    11  ----    -1-2    11--11--",
        "cloisterr.png  2   reg   ggrg    --  --1-    ----    11111111",
        "cloister.png   4   reg   gggg    --  ----    ----    11111111",

        "city1.png      5   reg   cggg    --  ----    1---    --111111",
        "city1rse.png   3   reg   crrg    --  -11-    1---    --122111",

        "city1rsw.png   3   reg   cgrr    --  --11    1---    --111221",
        "city1rswe.png  3   reg   crrr    --  -123    1---    --122331",
        "city1rwe.png   4   start crgr    --  -1-1    1---    --122221"
    ]).chain().map(function(s) {

        return s.replace(/ +/g, " ").split(" ");

    }).map(function(item) {

        var edges = item[3].split("");
        var roadEdges = item[5].split("");
        var cityEdges = item[6].split("");
        var grassEdges = item[7].split("");

        // finds how many road edges the tile has in order to detect if tile has a road end.
        // tiles with road ends have 1, 3, or 4 road edges while tiles with continuous roads have 2 road edges
        var roadEdgeCount = _(edges).reduce(function(count, def) { return def === "r" ? count + 1 : count; }, 0);

        // This is a tile object
        return {
            img: item[0],
            north: {edge: edgeDefs[edges[0]], road: roadEdges[0], city: cityEdges[0], grass: [grassEdges[0], grassEdges[1]]},
            east: {edge: edgeDefs[edges[1]], road: roadEdges[1], city: cityEdges[1], grass: [grassEdges[2], grassEdges[3]]},
            south: {edge: edgeDefs[edges[2]], road: roadEdges[2], city: cityEdges[2], grass: [grassEdges[4], grassEdges[5]]},
            west: {edge: edgeDefs[edges[3]], road: roadEdges[3], city: cityEdges[3], grass: [grassEdges[6], grassEdges[7]]},
            isStart: (item[2]=="start"),
            hasTwoCities: item[4]==="11",
            hasRoadEnd: [1, 3, 4].indexOf(roadEdgeCount) !== -1,
            count: parseInt(item[1])
        };

    }).sortBy(function(item){

        // make sure the starter is at the end
        return item.isStart;

    }).each(function(tileDef){

        for(var i = 0; i < tileDef.count; i++){
            tiles.push(new Tile(
                tileDef.img,
                tileDef.north,
                tileDef.east,
                tileDef.south,
                tileDef.west,
                tileDef.hasTwoCities,

                tileDef.hasRoadEnd
            ));
        }

    });

    //
    // Sort the tiles randomly
    //
    var starterTile = tiles.pop();
    tiles = _(tiles).sortBy(function(tile){ return Math.random(); });
    tiles = [starterTile].concat(tiles);

    //
    // Create world as (72 * 2) x (72 * 2) matrix
    // [   col   col
    //  [ tile, tile .. ],  row
    //  [ tile, tile .. ],  row
    // ]
    //
    var world = new Array(tiles.length * 2);
    for(var i = 0; i < world.length; i++){
        world[i] = new Array(tiles.length * 2);
    }

    function placeTile(row, col, tile){
        world[row][col] = tile;
    };

    var center = tiles.length;

    // bootstrap tile is placed in the middle.
    placeTile(center,center,tiles[0]);

    var maxcol = center;
    var mincol = center;
    var maxrow = center;
    var minrow = center;

    var candidateLocations = [];
    var candidateTile;

    //
    // Build the world outwards in carcassone style by building lists
    // of compatible locations and then choosing one randomly.
    // if the compatible location list is empty for a given tile,
    // we toss that tile out.
    //
    _(tiles.slice(1, 2)).each(function(tile, i){

        // ignore the starter tile because we already placed it.
        if (tile.isStart) {
            return;
        }

        //
        // For actual game simulation:
        //
        // TODO: round robin through players
        // TODO: place meeple
        // TODO: account for farms.. road networks.. city networks.. cloisters
        //

        var adjacents = _([
            {direction: "north", rowOffset:-1, colOffset: 0}, // up one row
            {direction: "south", rowOffset: 1, colOffset: 0}, // down one row
            {direction: "west",  rowOffset: 0, colOffset:-1}, // left one column
            {direction: "east",  rowOffset: 0, colOffset: 1}  // right one column
        ]);

        function getOppositeDirection(direction) {
            return {
                "east": "west",
                "west": "east",
                "north": "south",
                "south": "north"
            }[direction];
        }

        function getRoadLength(row, col, incomingDir) {
            // starting at this tile find the legnth of the road
            var tile = world[row][col];

            // Empty space
            if (!tile) { return 0; }

            var edges = tile.edges;

            if ([edges.north.edge, edges.south.edge, edges.east.edge, edges.west.edge].indexOf(EDGE_TYPE_ROAD) === -1) {
                // This tile does contain a road
                return 0;
            } else {
                // Tile contains a road, length is set at 1
                var total = 1;
            }

            if (!tile.hasRoadEnd) {
                // cycle through directions
                adjacents.each(function(adj) {
                    // is direction a road connection?
                    if (edges[adj.direction].edge === EDGE_TYPE_ROAD) {
                        // is the connection the incoming connection?
                        if (adj.direction !== incomingDir) {
                            total += getRoadLength(row + adj.rowOffset, col + adj.colOffset, getOppositeDirection(adj.direction));
                        }
                    }
                });
            }

            return total;
        }

        //
        // scans current tilespace bounding box and padding to find available tile positions
        //
        for(var row = minrow - 1; row < maxrow + 2; row++){
            for(var col = mincol - 1; col < maxcol + 2; col++){
                // The starting tile position is 72, 72 the middle of the tilespace matrix
                // The first iteration will check the available spaces around this position
                // ie. a 3x3 grid centered on 72, 72 rows 71->73 cols 71->73

                // As more tiles are added the bounding box params minrow, maxrow and
                // mincol, maxcol will expand and so will the scan area.

                if(typeof(world[row][col])==='undefined'){

                    // this is an empty slot. See if we can place a tile here

                    //
                    // try 0 to 3 turns for each tile (TODO: cull turns that yield equal tiles)
                    //
                    for(var turns = 0; turns < 4; turns++){
                        var valids = 0;
                        var invalids = 0;

                        //
                        // try each adjacent. A valid candidate will have
                        // valids > 0 and invalids == 0
                        //
                        adjacents.each(function(adj){
                            var otherTile = world[row + adj.rowOffset][col + adj.colOffset];
                            //
                            // is there a tile here? if empty, that doesn't contribute to invalids
                            //
                            if(typeof(otherTile)!=='undefined'){
                                //
                                // TODO: try each tile rotation
                                //
                                if(tile.connectableTo(adj.direction, otherTile, turns)){
                                    valids++;
                                } else {
                                    invalids++;
                                    // detect length of road when tile is placed.
                                }
                            }
                        });

                        if(valids > 0 && invalids === 0){
                            // store location, rotation, and number of connected edges
                            // we can use the number of connected edges later for
                            // optimal placement and hole-filling
                            candidateLocations.push([row, col, turns, valids]);
                        }
                    }

                } else {
                    // This spot is taken. Ignore
                }
            }

            candidateTile = tile;
        }

        //
        // Choose a random candidate location and place the tile there.
        //
        // if(candidateLocations.length > 0){
        //     var candidateIndex = Math.round(Math.random() * (candidateLocations.length - 1));
        //     var placementLocation = candidateLocations[candidateIndex];

        //     // if we have rotation, apply rotation now
        //     if(placementLocation[2] != 0){
        //         tile.rotate(placementLocation[2]);
        //     }

        //     placeTile(placementLocation[0], placementLocation[1], tile);
        //     maxrow = Math.max(maxrow, placementLocation[0]);
        //     minrow = Math.min(minrow, placementLocation[0]);
        //     maxcol = Math.max(maxcol, placementLocation[1]);
        //     mincol = Math.min(mincol, placementLocation[1]);

        //     // detect length of road when tile is placed.
        //     //console.log(getRoadLength(placementLocation[0], placementLocation[1]));
        // } else {
        //     // uh oh.. we have to throw this tile out
        // }
    });

    console.log("Generated world in ", ((new Date()).getTime() - startTime), "ms" );

    return {
        // return extents so that we can render a minimally-sized world
        world: world,
        candidateLocations: candidateLocations,
        candidateTile: candidateTile,
        extents: {
            maxrow: maxrow,
            maxcol: maxcol,
            minrow: minrow,
            mincol: mincol
        }
    };
};


function drawWorld(worldObject){
    var world = worldObject.world;
    var extents = worldObject.extents;
    var candidateTile = worldObject.candidateTile;
    var rotation = candidateTile.getRotation();
    var candidateLocations = worldObject.candidateLocations;

    var locations = new Array(world.length);
    for(var i = 0; i < locations.length; i++){
        locations[i] = new Array(world.length);
    }

    for (var i = 0, l = candidateLocations.length; i < l; i++) {
        var location = candidateLocations[i];
        var row = location[0];
        var col = location[1];
        var value = [location[2], location[3]];

        if (locations[row][col] == undefined) {
            locations[row][col] = [value];
        } else {
            locations[row][col].push(value);
        }
    }

    var startTime = (new Date()).getTime();

    var counter = 0;

    var table = $("<table><tbody></tbody></table>");
    tbody = table.find("tbody");

    for(var row = extents.minrow - 1; row < extents.maxrow + 2; row++){
        var tr = $("<tr></tr>");
        for(var col = extents.mincol - 1; col < extents.maxcol + 2; col++){
            var td;
            if(typeof(world[row][col])=='undefined'){
                var loc = locations[row][col];
                if (typeof(loc) != 'undefined') {
                    var set = false;
                    for (var i = 0, l = loc.length; i < l; i++) {
                        if (loc[i][0] == rotation) {
                            td = $("<td class='candidate' row='" + row + "' col='" + col + "'></td>");
                            set = true;
                            break;
                        }
                    }

                    if (! set) {
                        td = $("<td row='" + row + "' col='" + col + "'></td>");
                    }
                }
                else {
                    td = $("<td row='" + row + "' col='" + col + "'></td>");
                }
            } else {
                td = $("<td row='" + row + "' col='" + col + "'><img src='img/" + world[row][col].getImage() + "' class='" + 
                       world[row][col].getRotationClass() + "' tindex='" + counter + 
                       "' row='" + row + "' col='" + col + "' /></td>");
                counter++;
            }
            tr.append(td);
        }
        tbody.append(tr);
    }

    $("#board").empty().append(table);

    $("#candidate").attr('src', 'img/' + candidateTile.getImage()).attr('class', candidateTile.getRotationClass());

    $("#left").unbind().click(function() {
        var rotation = candidateTile.getRotation();
        if (rotation == 0) {
            candidateTile.rotate(3);
        } else {
            candidateTile.rotate(rotation - 1);
        }

        drawWorld(worldObject);
    });

    $("#right").unbind().click(function() {
        var rotation = candidateTile.getRotation();
        if (rotation == 3) {
            candidateTile.rotate(0);
        } else {
            candidateTile.rotate(rotation + 1);
        }

        drawWorld(worldObject);
    });

    console.log("Rendered world in ", ((new Date()).getTime() - startTime), "ms" );
};


function countFarm(worldObject){
    var world = worldObject.world;
    var extents = worldObject.extents;

    var counter = 0;

    for(var row = extents.minrow; row < extents.maxrow + 1; row++){
        for(var col = extents.mincol; col < extents.maxcol + 1; col++){
            if(typeof(world[row][col])!='undefined'){
                td = $("<td><img src='img/" + world[row][col].getImage() + "' class='" + world[row][col].getRotationClass() + "' tindex='" + counter + "' row='" + row + "' col='" + col + "' /></td>");
                counter++;
            }
        }
    }


    console.log("Rendered world in ", ((new Date()).getTime() - startTime), "ms" );
};


//
// In-browser bootstrap
//
$(function(){
    var scrollbarWidth = $.scrollbarWidth();

    $(window).resize(function() {
        $('#board').height($(window).height() - scrollbarWidth - 120);
    }).resize();

    var world = generateRandomWorld();
    drawWorld(world);
});
