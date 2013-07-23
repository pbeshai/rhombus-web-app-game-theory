define([
  "app",
  "modules/Participant",
  "modules/Grid"
],

function (app, Participant, Grid) {
  var Common = {
    Models: {},
    Views: {}
  };

  Common.Models.GroupModel = Backbone.Model.extend({
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

  Common.Models.Instructions = Backbone.Model.extend({
    initialize: function (attrs, options) {
      _.defaults(this.attributes, { header: this.header, description: this.description, buttonConfig: this.buttonConfig });

      // easy way to initialize with a config is to subclass and supply a configInit function
      // while passing a config object as an option
      if (_.isFunction(this.configInit)) {
        this.configInit(options.config);
      }
    }
  });

  Common.Views.Instructions = Backbone.View.extend({
    template: "common/instructions",
    className: "instructions",

    serialize: function () {
      return {
        header: this.model.get("header") || "Instructions",
        description: this.model.get("description"),
        buttons: [ "A", "B", "C", "D", "E" ],
        buttonConfig: this.model.get("buttonConfig"), // buttonConfig: { A: { description: "" }, B: undefined } undefined = disabled
      }
    }
  });

  Common.Views.ParticipantPlay = Backbone.View.extend({
    template: "common/participant_play",
    className: "participant player",
    playedClass: "played",
    defaults: {
      locked: false
    },
    overrides: { },

    serialize: function () {
      return { model: this.model };
    },

    beforeRender: function () {
      var played = this.model.get("played");
      if (played) {
        this.$el.addClass(this.playedClass);
      }
    },

    afterRender: function () {
      var played = this.model.get("played"), complete = this.model.get("complete");
      if (played && !complete) {
        this.$(".played-text").hide().delay(200).fadeIn(400);
      }
    },

    safeRender: function () {
      if (!this.options.locked) {
        this.render();
      }
    },

    initialize: function (options) {
      this.options = _.defaults(options || {}, this.overrides, this.defaults);
      this.listenTo(this.model, "change", this.safeRender);
    }
  });

  Common.Views.ParticipantHiddenPlay = Common.Views.ParticipantPlay.extend({
    template: "common/participant_hidden_play",

    afterRender: function () {
      var played = this.model.get("played"), complete = this.model.get("complete");
      if (played && !complete) {
        this.$(".medium-text").hide().delay(200).fadeIn(400);
      }
    },
  });

  // creates a participant with a message inside it (e.g. the offer in the ultimatum game)
  Common.Views.ParticipantMessagePlay =  Common.Views.ParticipantPlay.extend({
    template: "common/participant_message_play",
    className: "participant player has-bottom",
    defaults: {
      locked: false,
      messageAttribute: "message"
    },
    overrides: { },

    serialize: function () {
      return {
        model: this.model,
        message: this.model.get(this.options.messageAttribute)
      };
    },
  });

  Common.Views.ParticipantDisplay = Backbone.View.extend({
    template: "common/participant_display",
    className: "participant",
    defaults: {
      locked: false,
      cssClass: function () { },
      bottomText: function () { },
      mainText: function () { }
    },
    overrides: { },

    serialize: function () {
      return {
        model: this.model,
        bottomText: this.options.bottomText(this.model),
        mainText: this.options.mainText(this.model)
      };
    },

    beforeRender: function () {
      // reset any extra classes added in after render (do this since we
      // do not know which classes are added by this.options.cssClass)
      this.$el.attr("class", this.className);
    },

    afterRender: function () {
      var bottomText = this.options.bottomText(this.model);
      if (bottomText) {
        this.$el.addClass("has-bottom");
      } else {
        this.$el.removeClass("has-bottom");
      }
      this.$el.addClass(this.options.cssClass(this.model));
    },

    safeRender: function () {
      if (!this.options.locked) {
        this.render();
      }
    },

    initialize: function (options) {
      this.options = _.defaults(options || {}, this.overrides, this.defaults);
      this.listenTo(this.model, "change", this.safeRender);
    }
  });


  Common.Views.ParticipantsGrid = Backbone.View.extend({
    className: "participant-grid",
    defaults: {
      ParticipantView: Grid.Views.Participant,
    },
    overrides: { },

    beforeRender: function () {
      this.collection.each(function (participant) {
        this.insertView(new this.options.ParticipantView({ model: participant }));
      }, this);
    },

    initialize: function (options) {
      this.options = _.defaults(options || {}, this.overrides, this.defaults);
      this.listenTo(this.collection, "reset", this.render);
    }
  });


  // uses a Participant collection
  Common.Views.SimpleLayout = Backbone.View.extend({
    template: "common/simple_layout",
    defaults: {
      header: "Participants",
      ParticipantView: null,
      ParticipantsView: Common.Views.ParticipantsGrid,
      PreParticipantsView: null,
      PostParticipantsView: null,
      InstructionsModel: null,
    },
    overrides: { }, // quick way for direct subclasses to override defaults

    serialize: function () {
      return {
        header: this.options.header,
        hasPlayers: (this.collection.length > 0),
      };
    },

    beforeRender: function () {
      var viewOptions = _.extend({
        collection: this.collection
      }, this.options);

      this.insertView(".participants", new this.options.ParticipantsView(viewOptions));

      if (this.options.PreParticipantsView != null) {
        this.insertView(".pre-participants", new this.options.PreParticipantsView(viewOptions));
      }

      if (this.options.PostParticipantsView != null) {
        this.insertView(".post-participants", new this.options.PostParticipantsView(viewOptions));
      }

      if (this.options.InstructionsModel != null) {
        this.insertView(new Common.Views.Instructions({ model: new this.options.InstructionsModel(null, { config: this.options.config }) }))
      }
    },

    initialize: function (options) {
      this.options = _.defaults({}, options, this.overrides, this.defaults);

      var participants = this.collection;
      app.participantServer.hookCollection(participants, this);
    },
  });


  // requires model Common.Models.GroupModel or similar
  Common.Views.GroupLayout = Backbone.View.extend({
    template: "common/group_layout",
    defaults: {
      header: "Groups",
      group1Name: "Group 1",
      group2Name: "Group 2",
      ParticipantView: null,
      ParticipantsView: Common.Views.ParticipantsGrid,
      PreParticipantsView: null,
      PostParticipantsView: null,
      PreGroupsView: null,
      PostGroupsView: null,
      inactive: {}
    },
    overrides: { }, // quick way for direct subclasses to override defaults

    serialize: function () {
      return {
        header: this.options.header,
        hasPlayers: (this.model.get("participants").length > 0),
        group1Name: this.options.group1Name,
        group2Name: this.options.group2Name
      };
    },

    beforeRender: function () {
      function addGroup(groupNum) {
        var viewOptions = _.extend({
          collection: this.model.get("group" + groupNum)
        }, this.options);
        // only specify ParticipantView if it is set.
        if (this.options.ParticipantView != null) {
          if (_.isFunction(this.options.ParticipantView)) {
            viewOptions.ParticipantView = this.options.ParticipantView;
          } else if (this.options.ParticipantView["group" + groupNum] != null) {
            viewOptions.ParticipantView = this.options.ParticipantView["group" + groupNum];
          }
        }
        this.insertView(".group" + groupNum + " .group-participants", new this.options.ParticipantsView(viewOptions));

        if (this.options.PreParticipantsView != null) {
          this.insertView(".group" + groupNum + " .pre-participants", new this.options.PreParticipantsView(viewOptions));
        }

        if (this.options.PostParticipantsView != null) {
          this.insertView(".group" + groupNum + " .post-participants", new this.options.PostParticipantsView(viewOptions));
        }
      }

      addGroup.apply(this, [1]);
      addGroup.apply(this, [2]);

      var viewOptions = _.extend({
        collection: this.model.get("participants")
      }, this.options);

      if (this.options.PreGroupsView != null) {
        this.insertView(".pre-groups", new this.options.PreGroupsView(viewOptions));
      }

      if (this.options.PostGroupsView != null) {
        this.insertView(".post-groups", new this.options.PostGroupsView(viewOptions));
      }
    },

    afterRender: function () {
      if (this.options.inactive.group1) {
        this.$(".group1").addClass("inactive");
      }
      if (this.options.inactive.group2) {
        this.$(".group2").addClass("inactive");
      }
    },

    initialize: function (options) {
      this.options = _.defaults({}, options, this.overrides, this.defaults);

      var participants = this.model.get("participants")
      app.participantServer.hookCollection(participants, this);
    },
  });

  Common.Views.GroupConfigure = Backbone.View.extend({
    template: "common/group_configure",
    modelOptions: {
      group1Name: "Group 1",
      group2Name: "Group 2"
    },
    defaults: {
      nameHeader: "Group Names",
      group1Label: "Group 1",
      group2Label: "Group 2"
    },

    events: {
      "change #group1-name-input" : "updateGroup1Name",
      "change #group2-name-input" : "updateGroup2Name"
    },

    serialize: function () {
      return {
        nameHeader: this.options.nameHeader,
        group1Label: this.options.group1Label,
        group2Label: this.options.group2Label,
        group1Name: this.model.get("group1Name"),
        group2Name: this.model.get("group2Name")
      }
    },

    updateGroup1Name: function (evt) {
      var group1Name = this.$("#group1-name-input").val();
      this.model.set("group1Name", group1Name);
    },

    updateGroup2Name: function (evt) {
      var group2Name = this.$("#group2-name-input").val();
      this.model.set("group2Name", group2Name);
    },

    initialize: function (options) {
      this.options = _.defaults({}, options, this.overrides, this.defaults);

      // use defaults so we don't overwrite if already there
      _.defaults(this.model.attributes, this.modelOptions);
    }
  });

  /*
  Model configure is for automatically generating a form from a JS object

  */
  Common.Views.ModelConfigure = {};
  var inputIds = 0;
  Common.Views.ModelConfigure.TextInput = Backbone.View.extend({
    template: "common/model_configure/text_input",
    events: {
      "change input": "update",
    },

    update: function (evt) {
      // attach an empty {} for flags that event handlers can use to communicate with
      this.trigger("update", this.options.key, evt.target.value, {});
    },

    serialize: function () {
      return {
        value: this.options.value,
        label: this.options.label,
        inputId: this.inputId
      }
    },

    initialize: function (options) {
      this.inputId = "model-configure-input-" + (inputIds++);
    }
  });

  Common.Views.ModelConfigure.ObjectConfigure = Backbone.View.extend({
    className: "object-configure",
    template: "common/model_configure/object_configure",

    serialize: function () {
      return {
        header: this.options.header,
      }
    },

    prettifyLabel: function (attr) {
      return _.map(attr, function (char, i) {
        if (i === 0) { // capitalize first letter
          return char.toUpperCase();
        }

        // add a space before a capital or a number
        return (/[A-Z0-9]/.test(char)) ? " "+char : char;
      }).join("");
    },

    beforeRender: function () {
      // handle simple properties first
      _.each(_.keys(this.model), function (attr) {
        var val = this.model[attr];
        if (!_.isObject(val)) { // insert a text field
          this.insertView(new Common.Views.ModelConfigure.TextInput({ key: attr, label: this.prettifyLabel(attr), value: val }));
        }
      }, this);

      // then handle objects
      _.each(_.keys(this.model), function (attr) {
        var val = this.model[attr];
        if (_.isObject(val)) {
          this.insertView(new Common.Views.ModelConfigure.ObjectConfigure({ key: attr, header: this.prettifyLabel(attr), model: val }));
        }
      }, this);
    },

    onUpdate: function (key, value, flags) {
      if (flags.handled) {
        return;
      }
      flags.handled = true;

      var curr = this.model[key]
      if (_.isNumber(curr)) { // if the current value is a number, try making this one a nubmer
        try {
          value = parseFloat(value);
        } catch (e) {
          console.log(e);
        }
      }
      this.model[key] = value;
    },

    initialize: function () {
      this.on("update", this.onUpdate);
    }
  });


  Common.Views.ModelConfigure.Layout = Backbone.View.extend({
    template: "common/model_configure/layout",

    serialize: function () {
      return this.model.attributes;
    },

    prettifyLabel: function (attr) {
      return _.map(attr, function (char, i) {
        if (i === 0) { // capitalize first letter
          return char.toUpperCase();
        }

        // add a space before a capital or a number
        return (/[A-Z0-9]/.test(char)) ? " "+char : char;
      }).join("");
    },

    beforeRender: function () {
      // handle simple properties first
      _.each(_.keys(this.model.attributes), function (attr) {
        var val = this.model.attributes[attr];

        if (!_.isObject(val)) { // insert a text field
          this.insertView(".form", new Common.Views.ModelConfigure.TextInput({ key: attr, label: this.prettifyLabel(attr), value: val }));
        }
      }, this);

      // then objects
      _.each(_.keys(this.model.attributes), function (attr) {
        var val = this.model.attributes[attr];

        if (_.isObject(val)) {
          this.insertView(".form", new Common.Views.ModelConfigure.ObjectConfigure({ key: attr, header: this.prettifyLabel(attr), model: val }));
        }
      }, this);
    },

    onUpdate: function (key, value, flags) {
      if (flags.handled) {
        return;
      }

      var curr = this.model.get(key);
      if (_.isNumber(curr)) { // if the current value is a number, try making this one a nubmer
        try {
          value = parseFloat(value);
        } catch (e) {
          console.log(e);
        }
      }
      this.model.set(key, value);
    },

    initialize: function () {
      // use defaults so we don't overwrite if already there
      _.defaults(this.model.attributes, this.modelOptions);

      this.on("update", this.onUpdate);
    }
  });


  return Common;
})