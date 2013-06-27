/**

	A place to test things.

*/
define([
  // Application.
  "app",
  "plugins/d3/rickshaw",
],

function(app, Rickshaw) {

  var Sandbox = app.module();

  Sandbox.Views.Sandbox = Backbone.View.extend({
    template: "sandbox/sandbox",

  	beforeRender: function () {
  	},

    afterRender: function () {

      var seriesData = [ [], [] ];
      var numRounds = 5;
      for (var i = 0; i < numRounds; i++) {
        for (var j = 0; j < seriesData.length; j++) {
          seriesData[j].push({x: i+1, y: Math.random()*5});
        }
      }

      // instantiate our graph!

      var graph = new Rickshaw.Graph( {
        element: this.$(".chart")[0],
        width: 960,
        height: 300,
        renderer: 'line',
        series: [
          {
            data: seriesData[0],
            name: 'Cooperated',
            className: "cooperated"
          }, {
            data: seriesData[1],
            name: 'Defected',
            className: "defected"
          },
        ]
      } );
      window.graph = graph;
      graph.render();

      var xAxis = new Rickshaw.Graph.Axis.X({
        graph: graph,
        ticks: numRounds,
        orientation: "bottom",
        element: this.$(".x-axis")[0],
      });
      xAxis.render();

      var yAxis = new Rickshaw.Graph.Axis.Y({
        graph: graph,
        orientation: "left",
        element: this.$(".y-axis")[0],
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
      });
      yAxis.render();

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


      var hoverTemplate = _.template( hoverTemplateCode );

      // customize hover behavior
      var Hover = Rickshaw.Class.create(Rickshaw.Graph.HoverDetail, {

        render: function(args) {
          var graph = this.graph;

          var points = args.points;
          var point = points.filter( function(p) { return p.active } ).shift();

          if (point.value.y === null) return;

          var formattedXValue = point.formattedXValue;
          var formattedYValue = point.formattedYValue;

          this.element.innerHTML = '';
          this.element.style.left = graph.x(point.value.x) + 'px';

          // TODO: use underscore templates to render.
          var data = {
            lines: args.detail,
            x: formattedXValue
          };
          var $lineDetail = $(hoverTemplate(data)).appendTo(this.element);

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

            //this.element.appendChild(item);



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

var hover = new Hover( { graph: graph, xFormatter: function (n) { return "Round " + n; } } );

    },
  	initialize: function () {
      app.setTitle("Sandbox");
  	},

  });

  return Sandbox;
});