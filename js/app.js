
var Tile = Backbone.Model.extend({
	
	initialize: function() {
	
		this.revealed = false
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
	}
});

var TileView = Backbone.Marionette.ItemView.extend({

	className: "grid-cell",
	
	events: {
		"click": "reveal"
	},
	
	initialize: function() {
	
		this.listenTo(this.model, "change", this.render);
	},
	
	render: function() {

		return this;
	},
	
	reveal: function() { 
	
		this.model.set("revealed", true);
		this.$el.addClass("revealed neutral");
		this.render();
	}
});

var GridView = Backbone.Marionette.CollectionView.extend({

	collection: new Grid(),
	
	el: "#game-grid",
	
	childView: TileView,

	onRender: function() { 

		// Wrap cells in a .grid-row every 9 cells.
		var cells = $("#game-grid > .grid-cell");

		for(var i = 0; i < cells.length; i+= 9)
			cells.slice(i, i+9).wrapAll('<div class="grid-row" />');
	}
});

new GridView().render();