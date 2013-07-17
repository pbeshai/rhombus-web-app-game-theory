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

      this.set("group1", new this.GroupCollection());
      this.set("group2", new this.GroupCollection());
      this.on("reset", this.assignGroups);

      var participants = attrs.participants;
      if (participants instanceof Backbone.Collection) {
        participants = participants.models;
      }

      var collection = new this.GroupCollection(participants);
      this.set("participants", collection);
      this.listenTo(collection, "reset", this.assignGroups);
      this.assignGroups(collection);
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

  Common.Views.ParticipantHiddenPlay = Backbone.View.extend({
    template: "common/participant_hidden_play",
    className: "participant",
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
        this.$(".medium-text").hide().delay(200).fadeIn(400);
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


  Common.Views.ParticipantGrid = Backbone.View.extend({
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


  // requires model Common.Models.GroupModel or similar
  Common.Views.GroupLayout = Backbone.View.extend({
    template: "common/group_layout",
    defaults: {
      header: "Groups",
      group1Name: "Group 1",
      group2Name: "Group 2",
      ParticipantView: null,
      ParticipantsView: Common.Views.ParticipantGrid,
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
        var viewOptions = {
          collection: this.model.get("group" + groupNum)
        };
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
          this.insertView(".group" + groupNum + " .pre-participants", new this.options.PreParticipantsView({ collection: viewOptions.collection }));
        }

        if (this.options.PostParticipantsView != null) {
          this.insertView(".group" + groupNum + " .post-participants", new this.options.PostParticipantsView({ collection: viewOptions.collection }));
        }
      }

      addGroup.apply(this, [1]);
      addGroup.apply(this, [2]);

      if (this.options.PreGroupsView != null) {
        this.insertView(".pre-groups", new this.options.PreGroupsView({
          collection: this.model.get("participants")
        }));
      }

      if (this.options.PostGroupsView != null) {
        this.insertView(".post-groups", new this.options.PostGroupsView({
          collection: this.model.get("participants")
        }));
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


  return Common;
})