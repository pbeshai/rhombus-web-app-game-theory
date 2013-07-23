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
    urlRoot: "/api/participants",

    defaults: {
      "played": false,
      "complete": false,
      "validChoices": [ "A", "B", "C", "D", "E" ] // if null, all choices are accepted
    },
    initialize: function () {
      // assumes choice is set with validate:true option
      this.on("change:choice", function (model, choice) {
        this.set("played", choice != null);

        if (this.get("complete")) { // only update choice if it isn't complete.
          this.attributes.choice = this.previous("choice");
        }
      });
    },

    // resets choice related attributes (retains alias)
    reset: function () {
      this.unset("complete", { silent: true });
      this.unset("played", { silent: true });
      this.unset("choice", { silent: true });
      this.set("validChoices", this.defaults.validChoices, { silent: true });
    },

    validate: function (attrs, options) {
      if (_.isEmpty(attrs.alias)) {
        return "cannot have empty alias"
      }

      if (this.get("validChoices") != null && attrs.choice != null && !_.contains(this.get("validChoices"), attrs.choice)) {
        return "invalid choice " + attrs.choice + ", valid choices are " + this.get("validChoices").join(", ");
      }
    }
  });

  Participant.Bot = Participant.Model.extend({
    bot: true,

    initialize: function () {
      Participant.Model.prototype.initialize.call(this);
      if (this.get("alias") === undefined) {
        this.set("alias", "bot");
      }

      // short delay before playing
      this.delayedPlay();
    },

    save: function () {
      console.log("trying to save bot");
      return false;
    },

    sync: function () {
      console.log("trying to sync bot");
      return false;
    },

    fetch: function () {
      console.log("trying to fetch bot");
      return false;
    },

    destroy: function () {
      console.log("trying to destroy bot");
      return false;
    },

    delayedPlay: function () {
      setTimeout(_.bind(this.play, this), 50);
    },

    play: function () {
      var choices = this.get("validChoices");
      var choice = choices[Math.min(Math.floor(Math.random() * choices.length), choices.length - 1)];
      this.set("choice", choice);
    }
  });


  Participant.Collection = Backbone.Collection.extend({
    url: "/api/participants",
  	model: Participant.Model,
    comparator: "alias",
    aliasMap: {},
    defaults: {
      acceptNew: false, // if true, users when data is received for users not in the collection, they are added
      validateOnChoice: true,
    },

  	initialize: function (models, options) {
      _.bind(this.updateFromServer, this);

      this.options = options = _.extend({}, this.defaults, options);
      // initialize alias->model map
      this.on("reset", this.initAliasMap);
      this.initAliasMap(models);
      this.on("add", this.addCallback);

      this.participantServer = app.participantServer;
  	},

    updateFromServer: function (data) {
      _.each(data.choices, function (choiceData, i) {
        var model = this.aliasMap[choiceData.id];
        if (model) {
          model.set({"choice": choiceData.choice}, { validate: this.options.validateOnChoice });
        } else {
          console.log("new user. accept new? ", this.options.acceptNew, this.options);
          this.trigger("new-user", choiceData);
          if (this.options.acceptNew) {
            console.log("adding new user");
            model = new Participant.Model({ alias: choiceData.id, choice: choiceData.choice });
            this.add(model);
          }
        }
      }, this);
    },

    // saves models without ids to database
    saveNew: function () {
      var newParticipants = this.filter(function (participant) {
        return participant.get("id") === undefined;
      });

      if (newParticipants.length) {
        var newToSave = new Participant.Collection(newParticipants);

        console.log("saving new participants", newParticipants);
        return Backbone.sync("create", newToSave, {
          url: this.url,
          success: function () { newToSave.reset(); },
          error: function () { newToSave.reset(); }
         });
      }
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
    },

    // matches each model with another, but not in a symmetric way.
    // e.g. A -> B -> C -> A  :: (A,B), (B,C), (C,A)
    pairModelsAsymmetric: function (models) {
      if (!_.isArray(models)) {
        models = this.models;
      }

      var indices = [];
      _.each(models, function (model, i) { indices[i] = i; });
      indices = _.shuffle(indices);

      if (indices.length < 2) {
        console.log("less than two models");
      } else {
        for(var i = 0; i < indices.length; i ++) {
          models[indices[i]].set("partner", models[indices[(i+1) % indices.length]]);
        }
      }
    },

    // put all the models into pairs
    pairModels: function (models) {
      if (!_.isArray(models)) {
        models = this.models;
      }

      var indices = [];
      _.each(models, function (model, i) { indices[i] = i; });
      indices = _.shuffle(indices);

      if (indices.length < 2) {
        console.log("less than two models");
      } else {
        for(var i = 0; i < (indices.length - (indices.length % 2)); i += 2) {
          models[indices[i]].set("partner", models[indices[i+1]]);
          models[indices[i+1]].set("partner", models[indices[i]]);
        }

        if (indices.length % 2 == 1) {
          console.log("uneven number of models, one model with no partner: " + models[indices[indices.length-1]].get("alias"));
        }
      }
    },

    addBot: function () {
      this.add(new Participant.Bot());
    },
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


  	beforeRender: function () {
  		this.collection.each(function (participant) {
  			this.insertView(".participant-list", new Participant.Views.Item({ model: participant }));
  		}, this);
  	},

  	initialize: function () {
  		this.listenTo(this.collection, {
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
        collection: this.collection,
        showChoice: this.options.showChoice
      };
    },

    beforeRender: function () {
      this.collection.each(function (participant) {
        this.insertView("tbody", new Participant.Views.TableItem({ model: participant, showChoice: this.options.showChoice }));
      }, this);
    },

    initialize: function () {
      this.listenTo(this.collection, {
        "reset": this.render,

        "fetch": function () {
          console.log("Fetch participants???");
        }
      });
    }

  });

  return Participant;
});