/**

	A place to test things.

*/
define([
  // Application.
  "app",
  "util/d3/variableWidthBarChart"
],

function(app, variableWidthBarChart) {

  var Sandbox = app.module();

  Sandbox.Views.Sandbox = Backbone.View.extend({
    template: "sandbox/sandbox",

  	beforeRender: function () {
  	},

    afterRender: function () {

      var chartData = [ {
          label: "A",
          value: 32,
          count: 1
        }, {
          label: "B",
          value: 0,
          count: 10
        }
      ];

      var chart = variableWidthBarChart();

      d3.select(".my-chart").datum(chartData).call(chart);

    },
  	initialize: function () {
      app.setTitle("Sandbox");
  	},

  });

  return Sandbox;
});