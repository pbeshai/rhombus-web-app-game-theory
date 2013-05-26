/**

	Control panel.

*/
define([
  // Application.
  "app"
],

function(app) {

  var Controls = app.module();


  Controls.Views.Controls = Backbone.View.extend({
    tagName: "div",
    className: "controls",
    template: "controls/controls",

  	serialize: function () {
  		return { };
  	},

  	initialize: function () {
      console.log("controls server: ", app.participantServer);
      /*
      this.listenTo(this.options.participants, {
  			"reset": this.render
  		});
      */
  	}

  });

  return Controls;
});