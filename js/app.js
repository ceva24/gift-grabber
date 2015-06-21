IconEnum = {
	ARROW: 0,
	NUMBER: 1,
	FIRE: 2,
	GIFT: 3
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

		var fires = 5;
		var arrows = 5;
		var numbers = 5;
	
		var tiles = this.models.slice();
		
		var giftTile;
		
		// add gift
		var location = Math.floor(Math.random() * (tiles.length - 1));
		
		tiles[location].set("icon", new Icon({ type: IconEnum.GIFT }));
		tiles.splice(location, 1);
		
		// add fires
		for (var i = 0; i < fires; i++) {
		
				var location = Math.floor(Math.random() * (tiles.length - 1));
				
				tiles[location].set("icon", new Icon({ type: IconEnum.FIRE }));
				tiles.splice(location, 1);
		}
		
		// add arrows
		for (var i = 0; i < arrows; i++) {
			
			var location = Math.floor(Math.random() * (tiles.length - 1));
			
			tiles[location].set("icon", new Icon({ type: IconEnum.ARROW, value: "up" }));
			tiles.splice(location, 1);
		}
		
		// add numbers
		for (var i = 0; i < numbers; i++) {
			
			var location = Math.floor(Math.random() * (tiles.length - 1));
			
			tiles[location].set("icon", new Icon({ type: IconEnum.NUMBER, value: 6 }));
			tiles.splice(location, 1);
		}
	},
	
	getDistanceFromGiftTile: function(tile) {

		gift = this.findWhere(function(model) { return model.get('icon').get("type") == IconEnum.GIFT });

		// calculate distance using tile's x/y and gift's x/y
		
		return 5;
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

var GiftTileView = TileView.extend({

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

	onRender: function() {

		// Wrap cells in a .grid-row every 9 cells.
		var cells = $("#game-grid > .grid-cell");

		for(var i = 0; i < cells.length; i += 9)
			cells.slice(i, i + 9).wrapAll('<div class="grid-row" />');
	},
	
	buildChildView: function(child, ChildViewClass, childViewOptions) {

		var icon = child.get("icon") ? child.get("icon").get("type") : null;

		if (icon == IconEnum.FIRE) {
			return new FireTileView(_.extend({ model: child }, childViewOptions));
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