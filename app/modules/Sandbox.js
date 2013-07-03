/**

	A place to test things.

*/
define([
  // Application.
  "app",
  "plugins/d3/rickshaw",
  "util/d3/rickshaw/timeseriesTooltip",
  "util/d3/rickshaw/graphs"
],

function (app, Rickshaw, TimeseriesTooltip, Graphs) {

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

      var timeSeries = Graphs.createTimeSeries(this, {
        graph: {
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
        },
        xAxis: {
          ticks: numRounds
        }
      });

      var hover = new TimeseriesTooltip({
        graph: timeSeries.graph,
        xFormatter: function (n) { return "Round " + n; }
      });
    },

  	initialize: function () {
    },

  });

  return Sandbox;
});