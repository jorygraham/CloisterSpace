EDGE_TYPE_CITY  = 'city'
EDGE_TYPE_GRASS = 'grass'
EDGE_TYPE_ROAD  = 'road'

edgeDefs = {
  'r': EDGE_TYPE_ROAD,
  'g': EDGE_TYPE_GRASS,
  'c': EDGE_TYPE_CITY
}


class Edge
  constructor: (@edge, @road, @city, @grass, @grassEdges) ->
    @string = 'edge: ' + @edge + ', road: ' + @road + ', city: ' + @city +
              ', grass: ' + @grass + ', grassEdges: ' + @grassEdges


class Tile
  constructor: (@image, north, east, south, west, @hasTwoCities, @hasRoadEnd, @isStart) ->
    @edges =
      north: north
      east:  east
      south: south
      west:  west

    @rotation = 0
    @rotationClass = 'r0'

  rotate: (turns) ->
    if turns not in [-3..3]
      throw 'Invalid Rotation'

    if turns != 0
      switch turns
        when -1 then turns = 3
        when -2 then turns = 2
        when -3 then turns = 1

      @rotation += turns
      @rotation -= 4 if @rotation > 3

      @rotationClass = 'r' + @rotation

      for i in [1..turns]
        tmp = @edges.north
        @edges.north = @edges.west
        @edges.west  = @edges.south
        @edges.south = @edges.east
        @edges.east  = tmp

  reset: ->
    @rotate(4 - @rotation) if @rotation > 0

  connectableTo: (other, from) ->
    oppositeDirection =
      "north": "south"
      "east" : "west"
      "south": "north"
      "west" : "east"

    to = oppositeDirection[from]

    @edges[from].edge is other.edges[to].edge


generateRandomTileSet = ->

  # order of edge specs is NESW
  #
  # More edge details:
  # RoadMap (order NESW),
  # CityMap (order NESW),
  # GrassMap (clockwise-order starting from top-edge on the left side.
  #           Or in compass notation: NNW,NNE,ENE,ESE,SSE,SSW,WSW,WNW)

  tileDefinitions = [
      'city1rwe.png   1   start crgr    --  -1-1    1---    --122221',
      'city1rwe.png   3   reg   crgr    --  -1-1    1---    --122221',
      'city4.png      1   reg   cccc    --  ----    1111    --------',
      'road4.png      1   reg   rrrr    --  1234    ----    12233441',
      'city3.png      3   reg   ccgc    --  ----    11-1    ----11--',
      'city3s.png     1   reg   ccgc    --  ----    11-1    ----11--',
      'city3r.png     1   reg   ccrc    --  --1-    11-1    ----12--',
      'city3sr.png    2   reg   ccrc    --  --1-    11-1    ----12--',
      'road3.png      4   reg   grrr    --  -123    ----    11122331',
      'city2we.png    1   reg   gcgc    --  ----    -1-1    11--22--',
      'city2wes.png   2   reg   gcgc    --  ----    -1-1    11--22--',
      'road2ns.png    8   reg   rgrg    --  1-1-    ----    12222111',
      'city2nw.png    3   reg   cggc    --  ----    1--1    --1111--',
      'city2nws.png   2   reg   cggc    --  ----    1--1    --1111--',
      'city2nwr.png   3   reg   crrc    --  -11-    1--1    --1221--',
      'city2nwsr.png  2   reg   crrc    --  -11-    1--1    --1221--',
      'road2sw.png    9   reg   ggrr    --  --11    ----    11111221',
      'city11ne.png   2   reg   ccgg    11  ----    12--    ----1111',
      'city11we.png   3   reg   gcgc    11  ----    -1-2    11--11--',
      'cloisterr.png  2   reg   ggrg    --  --1-    ----    11111111',
      'cloister.png   4   reg   gggg    --  ----    ----    11111111',
      'city1.png      5   reg   cggg    --  ----    1---    --111111',
      'city1rse.png   3   reg   crrg    --  -11-    1---    --122111',
      'city1rsw.png   3   reg   cgrr    --  --11    1---    --111221',
      'city1rswe.png  3   reg   crrr    --  -123    1---    --122331'
    ]

  tileSets = for tileDef in tileDefinitions
    regExp = RegExp(' +', 'g')
    tile = tileDef.replace(regExp, ' ').split(' ')

    count = tile[1]

    image = tile[0]
    isStart = tile[2] is 'start'
    hasTwoCities = tile[4] is '11'

    edges = tile[3].split('')
    road  = tile[5].split('')
    city  = tile[6].split('')
    grass = tile[7].split('')

    roadEdgeCount = (edge for edge in edges when edge is 'r').length
    hasRoadEnd = roadEdgeCount is (1 or 3 or 4)

    north = new Edge(edgeDefs[edges[0]], road[0], city[0], grass[0], grass[1])
    east  = new Edge(edgeDefs[edges[1]], road[1], city[1], grass[2], grass[3])
    south = new Edge(edgeDefs[edges[2]], road[2], city[2], grass[4], grass[5])
    west  = new Edge(edgeDefs[edges[3]], road[3], city[3], grass[6], grass[7])

    for i in [1..count]
      new Tile(image, north, east, south, west, hasTwoCities, hasRoadEnd, isStart)

  tiles = [].concat tileSets...

  # This operation is ugly, but necessary
  [tiles[0]].concat _(tiles[1..tiles.length]).sortBy(-> Math.random())


createWorldObject = (tiles) ->

  # Pre-condition: tiles[0] will be the starting tile.
  # Post-condition: The starting tile is consumed.

  center = tiles.length

  board = (new Array(center * 2) for i in [1..center * 2])
  board[center][center] = tiles.shift()

  worldObject =
    board:  board
    center: center
    minrow: center
    maxrow: center
    mincol: center
    maxcol: center


findValidPositions = (world, tile) ->

  adjacents =
    north:
      row:-1
      col: 0
    east:
      row: 0
      col: 1
    south:
      row: 1
      col: 0
    west:
      row: 0
      col:-1

  board = world.board

  candidates = []

  for row in [world.minrow - 1..world.maxrow + 1]
    for col in [world.mincol - 1..world.maxcol + 1]
      if not board[row][col]?
        for turns in [0..3]

          tile.rotate(turns)

          valids = 0
          invalids = 0

          for side, offsets of adjacents
            other = board[row + offsets.row][col + offsets.col]
            if other?
              if tile.connectableTo(other, side)
                valids++
              else
                invalids++

          if valids > 0 and invalids is 0
            candidates.push([row, col, turns])

          tile.reset()

  # sortedCandidates = (new Array() for i in [0..3])

  # for candidate in candidates
  #   sortedCandidates[candidate[2]].push(candidate)

  # sortedCandidates

  candidates


placeTile = (world, tile, candidateLocations) ->
  if candidateLocations.length > 0
    i = Math.round(Math.random() * (candidateLocations.length - 1))
    [row, col, turns] = candidateLocations[i]

    tile.rotate(turns) if turns > 0

    world.board[row][col] = tile

    world.maxrow = Math.max(world.maxrow, row)
    world.minrow = Math.min(world.minrow, row)
    world.maxcol = Math.max(world.maxcol, col)
    world.mincol = Math.min(world.mincol, col)


drawWorld = (world) ->

  board = world.board

  table = $("<table><tbody></tbody></table>")
  tbody = table.find("tbody")

  for row in [world.minrow - 1..world.maxrow + 1]
    tr = $("<tr></tr>")

    for col in [world.mincol - 1..world.maxcol + 1]
      td = $("<td row='" + row + "' col='" + col + "'></td>")

      tile = board[row][col]
      if tile?
        td = $("<td row='" + row + "' col='" + col + "'>" +
               "<img src='img/" + tile.image +
               "' class='" + tile.rotationClass + "'/></td>")

      tr.append(td)

    tbody.append(tr)

  $("#board").empty().append(table)


drawTile = (world, tile, candidateLocations) ->

  $('#candidate').attr('src', 'img/' + tile.image).attr('class', tile.rotationClass)

  candidates = for locations in candidateLocations[tile.rotation]
    [row, col, rotation] = locations
    $("td[row=" + row + "][col=" + col + "]").attr('class', 'candidate').click(=>
      for candidate in candidates
        candidate.attr('class', '').unbind()

        world[row][col] = tile
      drawWorld(world)
    )

  $('#left').unbind().click(->
    for candidate in candidates
      candidate.attr('class', '').unbind()

    tile.rotate(-1)
    drawTile(tile, candidateLocations)
  )

  $('#right').unbind().click(->
    for candidate in candidates
      candidate.attr('class', '').unbind()

    tile.rotate(1)
    drawTile(tile, candidateLocations)
  )

tiles = generateRandomTileSet()
world = createWorldObject(tiles)

for tile in tiles
  positions = findValidPositions(world, tile)
  placeTile(world, tile, positions)

drawWorld(world)
