var Icon = Backbone.Model.extend({});

var Tile = Backbone.Model.extend({

    initialize: function() {

        this.revealed = false;
        this.dead = false;
    }
});

var TileCollection = Backbone.Collection.extend({

    model: Tile
});

var Grid = Backbone.Model.extend({

    grid: new TileCollection(),

    initialize: function() {

        for (var y = 7; y >= 1; y--)
            for (var x = 1; x <= 9; x++)
                this.grid.add(new Tile({ x: x, y: y }));

        this.populateIcons();
    },

    populateIcons: function() {

        var self = this;

        var tiles = this.grid.models.slice();

        var giftTile = addIconToRandomTile(IconEnum.GIFT, tiles);

        for (var i = 0; i < this.get("fires"); i++)
            addIconToRandomTile(IconEnum.FIRE, tiles);

        for (var i = 0; i < this.get("numbers"); i++)
            addNumberIconToRandomSuitableTile(tiles);

        for (var i = 0; i < this.get("arrows"); i++)
            addIconToRandomTile(IconEnum.ARROW, tiles);

        function addNumberIconToRandomSuitableTile(tiles) {

            // Limit the distance from the gift that number tiles can be
            var suitableTiles = _.filter(tiles, function(tile) { return (self.getDistanceFromGiftTile(tile, giftTile) <= Math.round(Math.sqrt(self.grid.models.length))); });

            var tile = addIconToRandomTile(IconEnum.NUMBER, suitableTiles);

            tiles.splice(tiles.indexOf(tile), 1);
        }

        function addIconToRandomTile(icon, tiles) {

            var randomLocation = Math.floor(Math.random() * (tiles.length - 1));
            var tile = tiles[randomLocation];

            var value;
            switch(icon) {

                case IconEnum.ARROW:  value = self.getDirectionToGift(tile, giftTile); break;
                case IconEnum.NUMBER: value = self.getDistanceFromGiftTile(tile, giftTile); break;
                default:              value = null;
            }

            tile.set("icon", new Icon({ type: icon, value: value }));
            tiles.splice(randomLocation, 1);

            return tile;
        }
    },

    getDirectionToGift: function(tile, giftTile) {

        var useLeftRight;

        // Determine whether this arrow will be left/right or up/down (sometimes there's no choice)
        if (tile.get("x") == giftTile.get("x")) {

            useLeftRight = false;
        }
        else if (tile.get("y") == giftTile.get("y")) {

            useLeftRight = true;
        }
        else {

            useLeftRight = (Math.random() > 0.5);
        }

        if (useLeftRight) {

            return (tile.get("x") > giftTile.get("x") ? "left" : "right");
        }
        else {

            return (tile.get("y") > giftTile.get("y") ? "down" : "up");
        }
    },

    getDistanceFromGiftTile: function(tile, giftTile) {

        return (Math.abs(tile.get("x") - giftTile.get("x")) + Math.abs(tile.get("y") - giftTile.get("y")));
    }
});

var App = Backbone.Model.extend({

    initialize: function(level) {

        var self = this;

        this.set({ won: false, transitioning: false, level: level });

        this.setTileCounts();

        this.set({ movesRemaining: self.get("moves") });
    },

    setTileCounts: function() {

        var level = this.get("level");

        this.set({
            moves: getNumberOfMoves(level),
            fires: getNumberOfFireTiles(level),
            arrows: getNumberOfArrowOrNumberTiles(level),
            numbers: getNumberOfArrowOrNumberTiles(level)
        });
    },

    decrementMoves: function() {

        this.set("movesRemaining", this.get("movesRemaining") - 1);
    }
});