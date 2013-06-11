/**

	A participant (e.g., a clicker user)

*/
define([
  // Application.
  "app",
],

function(app) {

  var Participant = app.module();

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
    defaults: {
      acceptNew: true // if true, users when data is received for users not in the collection, they are added
    },

  	initialize: function (models, options) {
      this.options = options = _.extend({}, this.defaults, options);
      // initialize alias->model map
      console.log("models = ", models, "this.models = ", this.models)
      this.on("reset", this.initAliasMap);
      this.initAliasMap(models);
      this.on("add", this.addCallback);

      this.participantServer = app.participantServer;

  		// update models on data received from server.
      this.listenTo(participantServer, "data", function (data) {
        console.log("data received", data);
				_.each(data.choices, function (choiceData, i) {
					var model = this.aliasMap[choiceData.id];
					if (model) {
						model.set({"choice": choiceData.choice}, { validate: options.validateOnChoice });
					} else {
            this.trigger("new-user", choiceData);
            if (this.options.acceptNew) {
              console.log("adding new user");
              model = new Participant.Model({ alias: choiceData.id, serverId: "test-server-id", choice: choiceData.choice});
              this.add(model);
            }
          }
				}, this);
			}, this);
  	},

    addCallback: function (model) {
      this.aliasMap[model.get("alias")] = model;
    },


    initAliasMap: function (models) {
      this.aliasMap = {};
      if (_.isArray(models)) {
        _.each(models, setAlias, this);
      } else {
        this.each(setAlias, this);
      }

      function setAlias(model) {
        var alias = model.get("alias");
        if (alias !== undefined) {
          this.aliasMap[alias] = model;
        }
      }
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