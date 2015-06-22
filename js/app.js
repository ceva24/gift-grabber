// TODO templates?

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

var Grid = Backbone.Collection.extend({

	model: Tile,
	
	initialize: function() {

		for (var y = 0; y <= 6; y++){
			for (var x = 0; x <= 8; x++) {
				this.add(new Tile({ x: x, y: y }));
			}
		}
	
		this.populate();
	},
	
	populate: function() {

		// to be set when creating a new Grid();
		var fires = 5;
		var arrows = 5;
		var numbers = 5;
	
		var tiles = this.models.slice();
		
		var giftTile;
		
		// add gift
		var location = Math.floor(Math.random() * (tiles.length - 1));
		
		tiles[location].set("icon", new Icon({ type: IconEnum.GIFT }));
		giftTile = tiles[location];
		
		tiles.splice(location, 1);
		
		// add fires
		for (var i = 0; i < fires; i++) { // TODO all these should be separated out into submethods, as arrows could be quite big - where should the submethods be?
		
				var location = Math.floor(Math.random() * (tiles.length - 1)); // TODO separate out this logic
				
				tiles[location].set("icon", new Icon({ type: IconEnum.FIRE }));
				tiles.splice(location, 1);
		}
		
		// add arrows
		for (var i = 0; i < arrows; i++) {
			
			var location = Math.floor(Math.random() * (tiles.length - 1)); // TODO where should the method be that calculates what direction arrow it is? same for number
			
			tiles[location].set("icon", new Icon({ type: IconEnum.ARROW, value: this.getDirectionToGift(tiles[location], giftTile) }));
			tiles.splice(location, 1);
		}
		
		// add numbers
		for (var i = 0; i < numbers; i++) { // TODO numbers should be less than 10 (or calculate a reasonable number for variable-size grid) otherwise too easy
			
			var location = Math.floor(Math.random() * (tiles.length - 1));
			
			tiles[location].set("icon", new Icon({ type: IconEnum.NUMBER, value: this.getDistanceFromGiftTile(tiles[location], giftTile) }));
			tiles.splice(location, 1);
		}
	},
	
	getDirectionToGift: function(tile, giftTile) {
	
		// TODO cleanup or comment
		var useLeftRight;
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
			return (tile.get("y") > giftTile.get("y") ? "up" : "down");
		}
	},
	
	getDistanceFromGiftTile: function(tile, giftTile) {

		return (Math.abs(tile.get("x") - giftTile.get("x")) + Math.abs(tile.get("y") - giftTile.get("y")));
	}
});

var TileView = Backbone.Marionette.ItemView.extend({

	className: "grid-cell",
	
	events: {
		"click": "reveal"
	},

	render: function() {
	
		return this;
	},
	
	reveal: function() { 
	
		if (!this.model.get("revealed")) {
		
			this.model.set("revealed", true);

			this.$el.addClass("revealed");

			this.setIcon();
			this.setType();
		}
	}
});

var EmptyTileView = TileView.extend({

	setIcon: function() {},
	
	setType: function() {
	
		this.$el.addClass("neutral");
	}
});

var GiftTileView = TileView.extend({ // TODO new icons or pngs

	setIcon: function() {
	
		this.$el.html('<span class="glyphicon glyphicon-gift" aria-hidden="true"></span>');
	},
	
	setType: function() {
	
		this.$el.addClass("good");
	}
});

var FireTileView = TileView.extend({

	setIcon: function() {
	
		this.$el.html('<span class="glyphicon glyphicon-fire" aria-hidden="true"></span>');
	},
	
	setType: function() {
	
		this.$el.addClass("bad");
	}
});

var ArrowTileView = TileView.extend({

	setIcon: function() {
	
		this.$el.html('<span class="glyphicon glyphicon-arrow-' + this.model.get("icon").get("value") + '" aria-hidden="true"></span>');
	},
	
	setType: function() {
	
		this.$el.addClass("good");
	}
});

var NumberTileView = TileView.extend({

	setIcon: function() {
	
		this.$el.html(this.model.get("icon").get("value"));
	},
	
	setType: function() {
	
		this.$el.addClass("good");
	}
});

var GridView = Backbone.Marionette.CollectionView.extend({

	collection: new Grid(),
	
	el: "#game-grid",

	childView: TileView,
	
	// TODO event that unreveals when fire

	onRender: function() {

		// Wrap cells in a .grid-row every 9 cells.
		var cells = $("#game-grid > .grid-cell");

		for(var i = 0; i < cells.length; i += 9)
			cells.slice(i, i + 9).wrapAll('<div class="grid-row" />');
	},
	
	buildChildView: function(child, ChildViewClass, childViewOptions) {

		var icon = child.get("icon") ? child.get("icon").get("type") : null;

		// TODO switch
		if (icon == IconEnum.FIRE) {
			return new FireTileView(_.extend({ model: child }, childViewOptions)); // TODO options top
		}
		else if (icon == IconEnum.ARROW) {
			return new ArrowTileView(_.extend({ model: child }, childViewOptions));
		}
		else if (icon == IconEnum.NUMBER) {
			return new NumberTileView(_.extend({ model: child }, childViewOptions));
		}
		else if (icon == IconEnum.GIFT) {
			return new GiftTileView(_.extend({ model: child }, childViewOptions));
		}	
		else {
			return new EmptyTileView(_.extend({ model: child }, childViewOptions));
		}
	}
});

new GridView().render();