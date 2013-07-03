define([
  "plugins/d3/rickshaw"
],

function (Rickshaw) {
	/**
		template can use x for the formattedXValue and lines obj which is the args.detail
	*/
	var hoverTemplateCode = '<div class="item multi active">'
      + '  <div class="x-value"><%= x %></div>'
      + '  <% _.each(lines, function (line) { %>'
      + '  <div class="line <%= line.series.className %>">'
      + '    <div class="y-value"><%= line.formattedYValue %></div>'
      + '    <div class="swatch"></div>'
      + '    <div class="name"><%= line.name %></div>'
      + '  </div>'
      + '  <% }); %>'
      + '</div>';

  // customize hover behavior
  var Tooltip = Rickshaw.Class.create(Rickshaw.Graph.HoverDetail, {
  	initialize: function (args) {
			Rickshaw.Graph.HoverDetail.prototype.initialize.apply(this, arguments);
			this.hoverTemplate = args.hoverTemplate || _.template( hoverTemplateCode );
  	},

    render: function(args) {
      var graph = this.graph;

      var points = args.points;
      var point = points.filter( function(p) { return p.active } ).shift();

      if (point.value.y === null) return;

      var formattedXValue = point.formattedXValue;
      var formattedYValue = point.formattedYValue;

      this.element.innerHTML = '';
      this.element.style.left = graph.x(point.value.x) + 'px';

      var data = {
        lines: args.detail,
        x: formattedXValue
      };
      var $lineDetail = $(this.hoverTemplate(data)).appendTo(this.element);

      // for each series
      args.detail.sort(function(a, b) { return a.order - b.order }).forEach( function(d) {
        if (d.value.y === null) return;

        var formattedXValue = d.formattedXValue;
        var formattedYValue = d.formattedYValue;

        var item = document.createElement('div');

        item.className = 'item active';

        // invert the scale if this series displays using a scale
        var series = d.series;
        var actualY = series.scale ? series.scale.invert(d.value.y) : d.value.y;

        item.innerHTML = this.formatter(series, d.value.x, actualY, formattedXValue, formattedYValue, d);

        var dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.top = graph.y(d.value.y0 + d.value.y) + 'px';
        dot.style.borderColor = d.series.color;

        this.element.appendChild(dot);

        dot.className = 'dot active';

      }, this);

      this.show();


      // place the tooltip at the average y value.
      var avgY = _.reduce(points, function (memo, point) { return memo+point.value.y; }, 0) / points.length;
      $lineDetail.css("top", (graph.y(point.value.y0 + avgY) - ($lineDetail.height()/2)) + 'px');

      if (typeof this.onRender == 'function') {
        this.onRender(args);
      }
    }
  });

	return Tooltip;
})