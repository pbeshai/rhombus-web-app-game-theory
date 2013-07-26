define([
  "app",
  "modules/Participant",
],

function (app, Participant) {
  var CommonModels = {};

  CommonModels.GroupModel = Backbone.Model.extend({
    url: null,
    GroupCollection: Participant.Collection,
    partnerUp: true, // if so, will partner people from group1 with those in group2

    // 'participants' is an array of models
    initialize: function (attrs, options) {
      this.options = _.extend({}, {
        forceEven: false
      }, options);

      this.set("group1", new this.GroupCollection());
      this.set("group2", new this.GroupCollection());
      this.on("reset", this.assignGroups);

      var participants = attrs.participants;
      if (participants instanceof Backbone.Collection) {
        participants = participants.models;
      }

      var collection = new this.GroupCollection(participants);
      // ensure we have even number of participants by adding a bot

      if (this.options.forceEven && collection.length % 2 === 1) {
        this.addBot(collection)
      }

      this.set("participants", collection);
      this.listenTo(collection, "reset", this.assignGroups);
      this.assignGroups(collection);
    },

    // TODO: maybe this can be an option to override it instead of just overriding...
    // can be overridden by subclasses to change type of bot added
    addBot: function (collection) {
      collection.add(new Participant.Bot());
    },

    // put the participants into groups and pair them up (group 1 participants paired with group 2)
    assignGroups: function (collection) {
      var models = (collection !== undefined) ? collection.models : this.get("participants").models;

      var indices = [];
      _.each(models, function (model, i) { indices[i] = i; });
      indices = _.shuffle(indices);

      if (indices.length < 2) {
        console.log("less than two models");
      } else {
        for(var i = 0; i < (indices.length - (indices.length % 2)); i += 2) {
          this.get("group1").add(models[indices[i]]);
          this.get("group2").add(models[indices[i+1]]);

          if (this.partnerUp) {
            models[indices[i]].set("partner", models[indices[i+1]]);
            models[indices[i+1]].set("partner", models[indices[i]]);
          }
        }

        if (indices.length % 2 == 1) {
          console.log("uneven number of models, one model with no partner: " + models[indices[indices.length-1]].get("alias"));
        }
      }
    },
  });

  CommonModels.Instructions = Backbone.Model.extend({
    initialize: function (attrs, options) {
      attrs = _.defaults(this.attributes, { header: this.header, description: this.description, buttonConfig: this.buttonConfig });
      var instrModel = this;
      // check if the description is a template, in which case, load it
      if (_.isObject(this.description) && this.description.template) {
          attrs.description = ""; // prevents [Object object] from showing up
          new Backbone.View({ template: this.description.template, serialize: options.config }).render().then(function () {
            instrModel.set("description", this.el.innerHTML);
          });
      }

      // easy way to initialize with a config is to subclass and supply a configInit function
      // while passing a config object as an option
      if (_.isFunction(this.configInit)) {
        this.configInit(options.config);
      }
    }
  });

  return CommonModels;
})