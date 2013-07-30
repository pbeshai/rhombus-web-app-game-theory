define([
	"app",
	"modules/Grid",
],
function (app, Grid) {
	var CommonViews = {};

  // sets 'this.options' and overrides properties with options if specified
  function handleOptions(object, options) {
    object.options = options = options || {};
    // override properties with options if specified
    _.each(object.optionProperties, function (property) {
      if (options[property]) {
        object[property] = options[property];
      }
    });
  }

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
    locked: false,
    optionProperties: [ "locked" ],

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
      if (!this.locked) {
        this.render();
      }
    },

    initialize: function (options) {
      handleOptions(this, options);
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
  CommonViews.ParticipantMessagePlay = CommonViews.ParticipantPlay.extend({
    template: "common/participant_message_play",
    className: "participant player has-bottom",
    messageAttribute: "message",
    optionProperties: [ "messageAttribute" ].concat(CommonViews.ParticipantPlay.prototype.optionProperties),

    serialize: function () {
      return {
        model: this.model,
        message: this.model.get(this.messageAttribute)
      };
    },
  });

  CommonViews.ParticipantDisplay = Backbone.View.extend({
    template: "common/participant_display",
    className: "participant",
    optionProperties: [ "locked", "cssClass", "bottomText", "mainText" ],
    locked: false,
    cssClass: function () { },
    bottomText: function () { },
    mainText: function () { },

    serialize: function () {
      return {
        model: this.model,
        bottomText: this.bottomText(this.model),
        mainText: this.mainText(this.model)
      };
    },

    beforeRender: function () {
      // reset any extra classes added in after render (do this since we
      // do not know which classes are added by this.cssClass)
      this.$el.attr("class", this.className);
    },

    afterRender: function () {
      var bottomText = this.bottomText(this.model);
      if (bottomText) {
        this.$el.addClass("has-bottom");
      } else {
        this.$el.removeClass("has-bottom");
      }
      this.$el.addClass(this.cssClass(this.model));
    },

    safeRender: function () {
      if (!this.locked) {
        this.render();
      }
    },

    initialize: function (options) {
      handleOptions(this, options);
      this.listenTo(this.model, "change", this.safeRender);
    }
  });


  CommonViews.ParticipantsGrid = Backbone.View.extend({
    className: "participant-grid",
    ParticipantView: Grid.Views.Participant,
    optionProperties: [ "ParticipantView" ],

    beforeRender: function () {
      this.collection.each(function (participant) {
        this.insertView(new this.ParticipantView({ model: participant }));
      }, this);
    },

    initialize: function (options) {
      handleOptions(this, options);
      this.listenTo(this.collection, "reset", this.render);
    }
  });

  // uses a Participant collection
  CommonViews.SimpleLayout = Backbone.View.extend({
    template: "common/simple_layout",
    // properties that can be overridden via options
    optionProperties: [ "header", "ParticipantView", "ParticipantsView", "PreParticipantsView", "PostParticipantsView", "InstructionsModel"],
    header: "Participants",
    ParticipantView: null,
    ParticipantsView: CommonViews.ParticipantsGrid,
    PreParticipantsView: null,
    PostParticipantsView: null,
    InstructionsModel: null,

    serialize: function () {
      return {
        header: this.header,
        hasPlayers: (this.collection.length > 0),
      };
    },

    beforeRender: function () {
      var viewOptions = _.extend({
        collection: this.collection
      }, this.options);

      if (this.ParticipantView != null) {
        this.insertView(".participants", new this.ParticipantsView(_.extend({
            ParticipantView: this.ParticipantView
          }, viewOptions)));
      } else {
        this.insertView(".participants", new this.ParticipantsView(viewOptions));
      }


      if (this.PreParticipantsView != null) {
        this.insertView(".pre-participants", new this.PreParticipantsView(viewOptions));
      }

      if (this.PostParticipantsView != null) {
        this.insertView(".post-participants", new this.PostParticipantsView(viewOptions));
      }

      if (this.InstructionsModel != null) {
        this.insertView(new CommonViews.Instructions({ model: new this.InstructionsModel(null, { config: this.options.config }) }))
      }
    },

    initialize: function (options) {
      handleOptions(this, options);
      app.participantServer.hookCollection(this.collection, this);
    },
  });

	// requires model Common.Models.GroupModel or similar
  CommonViews.GroupLayout = Backbone.View.extend({
    template: "common/group_layout",
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
    inactive: {},
    optionProperties: [ "header", "group1Name", "group2Name", "group1NameSuffix", "group2NameSuffix",
                        "ParticipantView", "ParticipantsView", "PreParticipantsView", "PostParticipantsView",
                        "PreGroupsView", "PostGroupsView", "InstructionsModel", "inactive" ],

    serialize: function () {
      return {
        header: this.header,
        hasPlayers: (this.model.get("participants").length > 0),
        group1Name: this.group1Name,
        group2Name: this.group2Name,
        group1NameSuffix: this.group1NameSuffix,
        group2NameSuffix: this.group2NameSuffix
      };
    },

    beforeRender: function () {
      function addGroup(groupNum) {
        var viewOptions = _.extend({
          collection: this.model.get("group" + groupNum)
        }, this.options);
        // only specify ParticipantView if it is set.
        if (this.ParticipantView != null) {
          if (_.isFunction(this.ParticipantView)) {
            viewOptions.ParticipantView = this.ParticipantView;
          } else if (this.ParticipantView["group" + groupNum] != null) {
            viewOptions.ParticipantView = this.ParticipantView["group" + groupNum];
          }
        }
        this.insertView(".group" + groupNum + " .group-participants", new this.ParticipantsView(viewOptions));

        if (this.PreParticipantsView != null) {
          this.insertView(".group" + groupNum + " .pre-participants", new this.PreParticipantsView(viewOptions));
        }

        if (this.PostParticipantsView != null) {
          this.insertView(".group" + groupNum + " .post-participants", new this.PostParticipantsView(viewOptions));
        }
      }

      addGroup.apply(this, [1]);
      addGroup.apply(this, [2]);

      var viewOptions = _.extend({
        collection: this.model.get("participants")
      }, this.options);

      if (this.PreGroupsView != null) {
        this.insertView(".pre-groups", new this.PreGroupsView(viewOptions));
      }

      if (this.PostGroupsView != null) {
        this.insertView(".post-groups", new this.PostGroupsView(viewOptions));
      }

      if (this.InstructionsModel != null) {
        this.insertView(new CommonViews.Instructions({ model: new this.InstructionsModel(null, { config: this.options.config }) }))
      }
    },

    afterRender: function () {
      if (this.inactive.group1) {
        this.$(".group1").addClass("inactive");
      }
      if (this.inactive.group2) {
        this.$(".group2").addClass("inactive");
      }
    },

    initialize: function (options) {
      handleOptions(this, options);
      app.participantServer.hookCollection(this.model.get("participants"), this);
    },
  });

  CommonViews.GroupConfigure = Backbone.View.extend({
    template: "common/group_configure",
    modelOptions: {
      group1Name: "Group 1",
      group2Name: "Group 2"
    },
    optionProperties: [ "nameHeader", "group1Label", "group2Label" ],
    nameHeader: "Group Names",
    group1Label: "Group 1",
    group2Label: "Group 2",

    events: {
      "change #group1-name-input" : "updateGroup1Name",
      "change #group2-name-input" : "updateGroup2Name"
    },

    serialize: function () {
      return {
        nameHeader: this.nameHeader,
        group1Label: this.group1Label,
        group2Label: this.group2Label,
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
      handleOptions(this, options);

      // use defaults so we don't overwrite if already there
      _.defaults(this.model.attributes, this.modelOptions);
    }
  });

  /*
  Model configure is for automatically generating a form from a JS object
  Typically used as a Views.Configure for apps
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
      flags.handled = true;

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