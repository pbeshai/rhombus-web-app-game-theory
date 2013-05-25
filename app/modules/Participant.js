/**

	A participant (e.g., a clicker user)

*/
define([
  // Application.
  "app",
],

function(app) {

  var Participant = app.module();

  // TODO: do we need this?
  Participant.Model = Backbone.Model.extend({

  });

  Participant.Collection = Backbone.Collection.extend({
  	model: Participant.Model,

  	initialize: function (models, options) {
      this.participantServer = options.participantServer;

  		// update models on data received from server.
			this.participantServer.on("data", function (data) {
        console.log("data received", data);
				_.each(data, function (choiceData) {
					var model = this.get(choiceData.id);
					if (model) {
						model.set("choice", choiceData.choice)
					}
				}, this);
			}, this);
  	}
  });

  Participant.Views.Item = Backbone.View.extend({
  	template: "participant_data",

  	serialize: function () {
  		return { model: this.model };
  	},

  	initialize: function () {
  		console.log("item init: ", this);
  		this.listenTo(this.model, "change", this.render);
  	}
  });

  Participant.Views.List = Backbone.View.extend({
  	template: "participant_list",

  	serialize: function () {
  		return { collection: this.options.participants };
  	},

  	beforeRender: function () {
  		this.options.participants.each(function (participant) {
  			this.insertView(".participant-list", new Participant.Views.Item({ model: participant }));
  		}, this)
  	},

  	initialize: function () {
  		console.log("collection init: ", this);
  		this.listenTo(this.options.participants, {
  			"reset": this.render,

  			"fetch": function () {
  				console.log("Fetch participants???");
  			}
  		});
  	}

  });

  return Participant;
});