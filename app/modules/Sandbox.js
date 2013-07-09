/**

	A place to test things.

*/
define([
  // Application.
  "app",
  "plugins/d3/rickshaw",
  "util/d3/rickshaw/graphs"
],

function (app, Rickshaw, Graphs) {

  var Sandbox = app.module();

  Sandbox.Views.Sandbox = Backbone.View.extend({
    template: "sandbox/sandbox",

  	beforeRender: function () {
  	},

    afterRender: function () {

      var seriesData = [ [], [] ];
      var numRounds = 2;
      for (var i = 0; i < numRounds; i++) {
        for (var j = 0; j < seriesData.length; j++) {
          seriesData[j].push({x: i+1, y: Math.random()*5, aux: j+i*100 + " people"});
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
          ticks: numRounds,
          tickFormat: function(n) {
            if (Math.floor(n) === n) {
              return "Round " + n;
            }
          }
        },
        yAxis: {
          ticks: 5
        },

        hover: {
          xFormatter: function (n) { return "Round " + n; }
        }
      });
    },

  	initialize: function () {
    },

  });

  return Sandbox;
});