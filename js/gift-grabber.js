function getRandomInt(min, max) {

    return Math.floor(Math.random() * (max - min + 1) + min);
}

IconEnum = {
    ARROW: 0,
    NUMBER: 1,
    FIRE: 2,
    GIFT: 3
    // Future enhancement - new icons: reveal area, moves, shuffle
};

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

    initialize: function() {

        var self = this;

        this.set({ won: false, restarting: false });

        this.setTileCounts();

        this.set({ movesRemaining: self.get("moves") });
    },

    setTileCounts: function() {

        this.set({
            moves: getRandomInt(20, 25),
            fires: getRandomInt(6, 18),
            arrows: getRandomInt(2, 8),
            numbers: getRandomInt(2, 8)
        });
    },

    decrementMoves: function() {

        this.set("movesRemaining", this.get("movesRemaining") - 1);
    }
});

var TileView = Backbone.Marionette.ItemView.extend({

    className: "grid-cell",

    events: {
        "click": "tileClicked",
        "tap": "tileClicked"
    },

    render: function() {

        if (this.model.get("revealed")) {

            this.$el.addClass("revealed");
            this.addContent();
        }
        else if (this.model.get("dead")) {

            this.$el.addClass("dead");
        }
        else {

            this.$el.removeClass("revealed");

            // Remove content
            this.$el.removeClass("bad neutral good");
            this.$el.html("");
        }

        return this;
    },

    tileClicked: function() {

        if (!this.model.get("revealed")) {

            this.reveal();
            this.performAction();
            this.trigger("tile:revealed");
        }
    },

    reveal: function() {

        this.model.set("revealed", true);
        this.render();
    },

    hide: function() {

        if (this.model.get("revealed")) {

            this.model.set("revealed", false);
            this.render();
        }
    },

    addContent: function() {},

    performAction: function() {}
});

var EmptyTileView = TileView.extend({

    addContent: function() {

        this.$el.addClass("neutral");
    }
});

var GiftTileView = TileView.extend({

    addContent: function() {

        this.$el.addClass("gift");
        this.$el.html('<span class="glyphicon glyphicon-gift" aria-hidden="true"></span>');
    },

    tileClicked: function() {

        if (!this.model.get("revealed")) {

            this.reveal();
            this.performAction();
        }
    },

    reveal: function() {

        TileView.prototype.reveal.call(this);

        this.trigger("win");
    },

    performAction: function() {

        this.$(".glyphicon").addClass("animated flash");
    }
});

var FireTileView = TileView.extend({

    addContent: function() {

        this.$el.addClass("bad");
        this.$el.html('<span class="glyphicon glyphicon-fire" aria-hidden="true"></span>');
    },

    hide: function() {

        TileView.prototype.hide.call(this);

        this.$el.removeClass("animated pulse");
    },

    performAction: function() {

        var self = this;

        this.$el.addClass("animated pulse");

        this.collection.each(function(tileView) {

            // Hide all tiles except this one
            if (tileView != self) tileView.hide();
        });
    }
});

var ArrowTileView = TileView.extend({

    addContent: function() {

        this.$el.addClass("good");
        this.$el.html('<span class="glyphicon glyphicon-arrow-' + this.model.get("icon").get("value") + '" aria-hidden="true"></span>');
    }
});

var NumberTileView = TileView.extend({

    addContent: function() {

        this.$el.addClass("good");
        this.$el.html(this.model.get("icon").get("value"));
    }
});

var GridView = Backbone.Marionette.CollectionView.extend({

    id: "#game-grid",

    className: "grid animated",

    childView: TileView,

    events: {
        "click .grid-cell": "tileClicked"
    },

    onRender: function() {

        // Wrap cells in a .grid-row every 9 cells
        var cells = this.$el.children();

        for(var i = 0; i < cells.length; i += 9)
            cells.slice(i, i + 9).wrapAll('<div class="grid-row" />');
    },

    buildChildView: function(child, ChildViewClass, childViewOptions) {

        var icon = child.get("icon") ? child.get("icon").get("type") : null;

        var options = _.extend({ model: child, collection: this.children }, childViewOptions);

        switch (icon) {

            case IconEnum.FIRE:   return new FireTileView(options);
            case IconEnum.ARROW:  return new ArrowTileView(options);
            case IconEnum.NUMBER: return new NumberTileView(options);
            case IconEnum.GIFT:   return new GiftTileView(options);
            default:              return new EmptyTileView(options);
        }
    },

    show: function() {

        this.$el.removeClass("fadeOut").addClass("fadeIn");
        this.render();
    },

    hide: function() {

        this.$el.removeClass("fadeIn").addClass("fadeOut");
    },

    revealAll: function() {

        var self = this;

        var delay = 0;

        this.children.each(function(tile) {

            setTimeout(function() {

                if(!tile.model.get("revealed"))
                    tile.reveal();

                if (tile === self.children.last())
                    self.trigger("end");

            }, delay);

            delay += 75;
        });
    },

    onChildviewTileRevealed: function() {

        this.trigger("tile:revealed");
    },

    onChildviewWin: function() {

        this.trigger("win");
    }
});

var StatsView = Backbone.View.extend({

    id: "stats",

    className: "stats-panel animated",

    template: _.template($("#template-stats").html()),

    render: function() {

        this.$el.html(this.template(this.model.attributes));
        return this;
    },

    show: function() {

        this.$el.removeClass("fadeOut").addClass("fadeIn");
        this.render();
    },

    hide: function() {

        this.$el.removeClass("fadeIn").addClass("fadeOut");
    },
});

var EndDialogView = Backbone.View.extend({

    id: "end-dialog",

    className: "animated fadeIn",

    template: _.template($("#template-end-dialog").html()),

    render: function() {

        this.$el.html(this.template(this.model.attributes));
        return this;
    }
});

var AppView = Backbone.View.extend({

    el: "#game-container",

    model: new App(),

    events: {
        "click #restart-button": "restart"
    },

    initialize: function() {

        this.on('restart', this.restart);

        this.start();
    },

    start: function() {

        this.createGrid();
        this.createStats();

        this.stats.render();
        this.grid.show();
        this.stats.show();
    },

    createGrid: function() {

        this.grid = new GridView({ collection: new Grid({ fires: this.model.get("fires"), arrows: this.model.get("arrows"), numbers: this.model.get("numbers") }).grid });

        this.$el.children("#game").append(this.grid.$el);

        this.listenTo(this.grid, "tile:revealed", this.tileRevealed);
        this.listenTo(this.grid, "win", this.win);
    },

    createStats: function() {

        this.stats = new StatsView({ model: this.model });

        this.stats.$el.insertBefore(this.grid.$el);
    },

    tileRevealed: function() {

        this.decrementMoves();

        if (this.model.get("movesRemaining") === 0)
            this.lose();
    },

    decrementMoves: function() {

        // Just in case, prevent moves remaining from ever displaying below 0
        if (this.model.get("movesRemaining") > 0)
            this.model.decrementMoves();

        this.stats.render();
    },

    restart: function() { // FIXME track down and remove all old left-over objects

        var self = this;

        if (!this.model.get("restarting")) {

            this.model.set("restarting", true);

            this.disableBoard();

            this.grid.hide();
            this.stats.hide();

            setTimeout(function() {

                self.grid.remove();
                self.stats.remove();

                self.grid.collection.reset();

                self.model.destroy();
                self.model = new App();

                self.start();

            }, 1000);
        }
    },

    lose: function() {

        this.grid.children.each(function(child) {

            child.model.set("dead", true);
            child.render();
        });

        this.reveal();
    },

    win: function() {

        this.decrementMoves();

        this.model.set("won", true);

        this.reveal();
    },

    reveal: function() {

        var self = this;

        this.disableBoard();

        this.listenTo(this.grid, "end", this.showEndDialog);

        setTimeout(function() { self.grid.revealAll(); }, 1000);
    },

    disableBoard: function() {

        this.stopListening();
        this.grid.children.each(function(child) { child.undelegateEvents(); });
    },

    showEndDialog: function() {

        var self = this;

        setTimeout(function() {

            $(".stats-row, .grid-row").fadeTo("slow", 0.5);

            var end = new EndDialogView({ model: self.model });
            self.grid.$el.append(end.$el);
            end.render();

        }, 1000);
    }
});

new AppView();