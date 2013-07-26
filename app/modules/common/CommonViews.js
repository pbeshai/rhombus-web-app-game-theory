define([
	"app",
	"modules/Grid",
],
function (app, Grid) {
	var CommonViews = {};

	CommonViews.Instructions = Backbone.View.extend({
    template: "common/instructions",
    className: "instructions",

    serialize: function () {
      return {
        header: this.model.get("header") || "Instructions",
        description: this.model.get("description"),
        buttons: [ "A", "B", "C", "D", "E" ],
        buttonConfig: this.model.get("buttonConfig"), // buttonConfig: { A: { description: "" }, B: undefined } undefined = disabled
      }
    },

    initialize: function () {
      this.listenTo(this.model, "change", this.render); // ensures the view is up to date
    }
  });

  CommonViews.ParticipantPlay = Backbone.View.extend({
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

  CommonViews.ParticipantHiddenPlay = CommonViews.ParticipantPlay.extend({
    template: "common/participant_hidden_play",

    afterRender: function () {
      var played = this.model.get("played"), complete = this.model.get("complete");
      if (played && !complete) {
        this.$(".medium-text").hide().delay(200).fadeIn(400);
      }
    },
  });

  // creates a participant with a message inside it (e.g. the offer in the ultimatum game)
  CommonViews.ParticipantMessagePlay =  CommonViews.ParticipantPlay.extend({
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

  CommonViews.ParticipantDisplay = Backbone.View.extend({
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


  CommonViews.ParticipantsGrid = Backbone.View.extend({
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
  CommonViews.SimpleLayout = Backbone.View.extend({
    template: "common/simple_layout",
    defaults: {
      header: "Participants",
      ParticipantView: null,
      ParticipantsView: CommonViews.ParticipantsGrid,
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
        this.insertView(new CommonViews.Instructions({ model: new this.options.InstructionsModel(null, { config: this.options.config }) }))
      }
    },

    initialize: function (options) {
      this.options = _.defaults({}, options, this.overrides, this.defaults);

      var participants = this.collection;
      app.participantServer.hookCollection(participants, this);
    },
  });

	// requires model Common.Models.GroupModel or similar
  CommonViews.GroupLayout = Backbone.View.extend({
    template: "common/group_layout",
    defaults: {
      header: "Groups",
      group1Name: "Group 1",
      group2Name: "Group 2",
      ParticipantView: null,
      ParticipantsView: CommonViews.ParticipantsGrid,
      PreParticipantsView: null,
      PostParticipantsView: null,
      PreGroupsView: null,
      PostGroupsView: null,
      InstructionsModel: null,
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

      if (this.options.InstructionsModel != null) {
        console.log("instr model with ", this.options);
        this.insertView(new CommonViews.Instructions({ model: new this.options.InstructionsModel(null, { config: this.options.config }) }))
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

  CommonViews.GroupConfigure = Backbone.View.extend({
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
  CommonViews.ModelConfigure = {};
  var inputIds = 0;
  CommonViews.ModelConfigure.TextInput = Backbone.View.extend({
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

  CommonViews.ModelConfigure.ObjectConfigure = Backbone.View.extend({
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
          this.insertView(new CommonViews.ModelConfigure.TextInput({ key: attr, label: this.prettifyLabel(attr), value: val }));
        }
      }, this);

      // then handle objects
      _.each(_.keys(this.model), function (attr) {
        var val = this.model[attr];
        if (_.isObject(val)) {
          this.insertView(new CommonViews.ModelConfigure.ObjectConfigure({ key: attr, header: this.prettifyLabel(attr), model: val }));
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


  CommonViews.ModelConfigure.Layout = Backbone.View.extend({
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
          this.insertView(".form", new CommonViews.ModelConfigure.TextInput({ key: attr, label: this.prettifyLabel(attr), value: val }));
        }
      }, this);

      // then objects
      _.each(_.keys(this.model.attributes), function (attr) {
        var val = this.model.attributes[attr];

        if (_.isObject(val)) {
          this.insertView(".form", new CommonViews.ModelConfigure.ObjectConfigure({ key: attr, header: this.prettifyLabel(attr), model: val }));
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

	return CommonViews;
});