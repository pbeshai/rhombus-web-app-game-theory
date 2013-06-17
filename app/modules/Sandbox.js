/**

	A place to test things.

*/
define([
  // Application.
  "app",
  "util/d3/variableWidthBarChart",
  "util/d3/xLine",
],

function(app, variableWidthBarChart, xLine) {

  var Sandbox = app.module();

  Sandbox.Views.Sandbox = Backbone.View.extend({
    template: "sandbox/sandbox",

  	beforeRender: function () {
  	},

    afterRender: function () {

      var chartData = [ {
          label: "A",
          value: 32,
          count: 4
        }, {
          label: "B",
          value: 15,
          count: 10
        }
      ];

/*
<div>
  <span class="value"><%= value %></span>
  <span class="total-value">(<span class="<%= (value < totalAverage) ? "below" : "above" %>"><%= (value - totalAverage) %></span>)</span>
</div>
<div class="count"><%= count %> people</div>
*/

      var chart = variableWidthBarChart()
        .tooltip(_.template('<h3><%= label %></h3><div class="value"><span class="value"><%= value.toFixed(1) %></span> <span class="total-value">(<span class="<%= (value < totalAverage) ? "below" : "above" %>"><%= (value - totalAverage).toFixed(1) %></span>)</span></div><div class="count"><%= count %> people</div>'), {
          totalAverage: 25
        });

      d3.select(".my-chart").datum(chartData).call(chart);

      var xline = xLine()
        .y(function (d) { return chart.yScale(d); })
        .width(chart.innerWidth());

      d3.select(".my-chart .chart-data").datum([25]).call(xline);



    },
  	initialize: function () {
      app.setTitle("Sandbox");
  	},

  });

  return Sandbox;
});