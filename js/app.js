// TODO separate files
// TODO build procedure

IconEnum = {
	ARROW: 0,
	NUMBER: 1,
	FIRE: 2,
	GIFT: 3
	// TODO new icons? reveal area, moves, others? shuffle? <- later levels
};

var Icon = Backbone.Model.extend({});

var Tile = Backbone.Model.extend({
	
	initialize: function() {
	
		this.revealed = false;
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
		
		//this.grid.each(function(tile) { tile.set("icon", null) }); // Reset previous icons TODO use in future ShuffleTile

		var tiles = this.grid.models.slice();

		var giftTile = addIconToRandomTile(IconEnum.GIFT, tiles);

		for (var i = 0; i < this.get("fires"); i++)
			addIconToRandomTile(IconEnum.FIRE, tiles);

		for (var i = 0; i < this.get("numbers"); i++)
			addNumberIconToRandomSuitableTile(tiles); 
			
		for (var i = 0; i < this.get("arrows"); i++)
			addIconToRandomTile(IconEnum.ARROW, tiles);
		
		function addNumberIconToRandomSuitableTile(tiles) { 
			
			// Limit the distance from the gift that number tiles can be.
			var suitableTiles = _.filter(tiles, function(tile) { return (self.getDistanceFromGiftTile(tile, giftTile) <= Math.round(Math.sqrt(self.grid.models.length))) });
			
			var tile = addIconToRandomTile(IconEnum.NUMBER, suitableTiles);
			
			tiles.splice(tiles.indexOf(tile), 1);
		}

		function addIconToRandomTile(icon, tiles) {

			var randomLocation = Math.floor(Math.random() * (tiles.length - 1));
			var tile = tiles[randomLocation];
			
			//console.log("adding " + icon + " to tile " + tile.get("x") + "," + tile.get("y"));

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

var TileView = Backbone.Marionette.ItemView.extend({

	className: "grid-cell",

	events: {
		"click": "reveal",
		"tap": "reveal"
	},

	render: function() {
		
		if (this.model.get("revealed")) {
			
			this.$el.addClass("revealed");
			this.addContent();
		}
		else {
			
			this.$el.removeClass("revealed"); 
			
			// Remove content
			this.$el.removeClass("bad neutral good");
			this.$el.html("");
		}
	
		return this;
	},
	
	reveal: function() {
	
		if (!this.model.get("revealed")) {
		
			this.model.set("revealed", true);
			this.performAction();
			this.trigger("tile:revealed");
			this.render();
		}
	},
	
	hide: function() {

		if (this.model.get("revealed")) {
			
			this.model.set("revealed", false);
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

var GiftTileView = TileView.extend({ // TODO new icons or pngs

	addContent: function() {
	
		this.$el.addClass("good");
		this.$el.html('<span class="glyphicon glyphicon-gift" aria-hidden="true"></span>');
	}
});

var FireTileView = TileView.extend({

	addContent: function() {
	
		this.$el.addClass("bad");
		this.$el.html('<span class="glyphicon glyphicon-fire" aria-hidden="true"></span>');
	},
	
	performAction: function() {
	
		var self = this;

		this.collection.each(function(tileView) {

			// Hide all tiles except this one
			if (tileView != self) {
				tileView.hide();
				tileView.render();
			}
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

	el: "#game-grid",

	childView: TileView,
	
	events: {
		"click .grid-cell": "tileClicked"
	},

	onRender: function() {

		// Wrap cells in a .grid-row every 9 cells
		var cells = $("#game-grid > .grid-cell");

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
		
		this.$el.addClass("animated fadeInRight");
		this.render();
	},
	
	onChildviewTileRevealed: function() {
		
		this.trigger("tile:revealed");
	}
});

var InfoView = Backbone.View.extend({

	el: "#info-screen",
	
	template: _.template($("#template-info").html()),
	
	events: {
		"click #info-text": "nextLevel"
	},
	
	render: function() {
		
		this.$el.html(this.template(this.model.attributes));
		return this;
	},
	
	nextLevel: function() {
	
		var self = this;
		
		this.$el.addClass("animated fadeOutLeft"); // TODO need a reset that removes these again and is called on initialize...(?) same for stats pane probably

		$(setTimeout(function() {

			self.$el.hide();
			self.trigger("next:level");
		
		}, 400));
	}
});

var StatsView = Backbone.View.extend({

	el: "#stats",
	
	template: _.template($("#template-stats").html()),
	
	render: function() {

		this.$el.html(this.template(this.model.attributes));
		return this;
	},
	
	show: function() {
		
		this.$el.addClass("animated fadeIn");
		this.render();
	}
});

var App = Backbone.Model.extend({

	initialize: function() {
	
		var self = this;
	
		this.set({
			level: 1,
			moves: 25,
			fires: 4,
			arrows: 5,
			numbers: 5
		});
		
		this.set({ movesRemaining: self.get("moves") });
	}
});

var AppView = Backbone.View.extend({

	model: new App(),

	el: "#game", // TODO decouple, pass into constructor
	
	initialize: function() {

		this.info = new InfoView({ model: this.model });
		this.listenTo(this.info, "next:level", this.nextLevel);
		
		this.stats = new StatsView({ model: this.model });
		
		this.info.render();
	},
	
	nextLevel: function() {
	
		var self = this;
		
		this.grid = new GridView({ collection: new Grid({ fires: this.model.get("fires"), arrows: this.model.get("arrows"), numbers: this.model.get("numbers") }).grid })
		this.listenTo(this.grid, "tile:revealed", this.tileRevealed);
		
		this.stats.render();
		this.grid.show();
		
		$(setTimeout(function() { self.stats.show() }, 1000));
	},
	
	tileRevealed: function() {
	
		// Just in case, prevent moves remaining from ever displaying below 0
		if (this.model.get("movesRemaining") > 0)
			this.model.set("movesRemaining", this.model.get("movesRemaining") - 1);
		
		this.stats.render();
		
		if (this.model.get("movesRemaining") == 0)
			this.gameOver();
	},
	
	gameOver: function() {

		this.stopListening();
		this.grid.children.each(function(child) { child.undelegateEvents() });
	}
});

// TODO need a restart button

new AppView();