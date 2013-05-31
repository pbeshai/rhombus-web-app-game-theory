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
    url: "/api/participant",

    validate: function (attrs, options) {
      if (_.isEmpty(attrs.alias)) {
        return "cannot have empty alias"
      }
      if (_.isEmpty(attrs.serverId)) {
        return "cannot have empty serverId"
      }
    }
  });

  Participant.Collection = Backbone.Collection.extend({
    url: "/api/participant/list",
  	model: Participant.Model,
    aliasMap: {},

  	initialize: function (models, options) {
      // initialize alias->model map
      this.on("reset", function () {
        this.aliasMap = {};
        //_.each(collection.models)
        this.each(function (model) {
          var alias = model.get("alias");
          if (alias !== undefined) {
            this.aliasMap[alias] = model;
          }
        }, this);

        console.log(this.aliasMap);
      });

      this.participantServer = options.participantServer;

  		// update models on data received from server.
			this.participantServer.on("data", function (data) {
        console.log("data received", data);
				_.each(data.choices, function (choiceData, i) {
					var model = this.aliasMap[choiceData.id];
					if (model) {
            console.log(model);
						model.set("choice", choiceData.choice)
					}
				}, this);
			}, this);
  	}
  });

  Participant.Views.Item = Backbone.View.extend({
  	template: "participant/item",

  	serialize: function () {
  		return { model: this.model };
  	},

  	initialize: function () {
  		this.listenTo(this.model, "change", this.render);
  	}
  });

  Participant.Views.List = Backbone.View.extend({
  	template: "participant/list",

  	serialize: function () {
  		return { collection: this.options.participants };
  	},

  	beforeRender: function () {
  		this.options.participants.each(function (participant) {
  			this.insertView(".participant-list", new Participant.Views.Item({ model: participant }));
  		}, this);
  	},

  	initialize: function () {
  		this.listenTo(this.options.participants, {
  			"reset": this.render,

  			"fetch": function () {
  				console.log("Fetch participants???");
  			}
  		});
  	}

  });

  Participant.Views.TableItem = Backbone.View.extend({
    template: "participant/table_item",
    tagName: "tr",

    serialize: function () {
      return {
        model: this.model,
        showChoice: this.options.showChoice
      };
    },

    initialize: function () {
      this.listenTo(this.model, "change", this.render);
    }
  });

  Participant.Views.Table = Backbone.View.extend({
    template: "participant/table",

    serialize: function () {
      return {
        collection: this.options.participants,
        showChoice: this.options.showChoice
      };
    },

    beforeRender: function () {
      this.options.participants.each(function (participant) {
        this.insertView("tbody", new Participant.Views.TableItem({ model: participant, showChoice: this.options.showChoice }));
      }, this);
    },

    initialize: function () {
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