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

    validate: function (attrs, options) {
      if (_.isEmpty(attrs.alias)) {
        return "cannot have empty alias"
      }
    }
  });

  Participant.Collection = Backbone.Collection.extend({
    url: "/api/participants",
  	model: Participant.Model,
    aliasMap: {},
    defaults: {
      acceptNew: false // if true, users when data is received for users not in the collection, they are added
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