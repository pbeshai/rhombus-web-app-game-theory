/**

	A simple grid app for displaying choices

*/
define([
  // Application.
  "app",

  "modules/Participant",

  "apps/StateApp",

  "util/d3/variableWidthBarChart",
  "util/d3/xLine"
],
function(app, Participant, StateApp, variableWidthBarChart, xLine) {

  var PrisonersDilemma = app.module();
  PrisonersDilemma.Views.Play = {};
  PrisonersDilemma.Views.Results = {};

  PrisonersDilemma.Model = Backbone.Model.extend({
    defaults: {
      "played": false,
      "partner": null,
      "score": null
    },
    initialize: function () {
      // assumes choice is set with validate:true option
      this.on("change:choice", function (model, choice) {
        this.set("played", true);
      });
    },

    validate: function (attrs, options) {
      if (attrs.choice !== "A" && attrs.choice !== "B") {
        return "invalid choice " + attrs.choice + ". valid choices are A or B.";
      }
    }
  });


  PrisonersDilemma.Bot = PrisonersDilemma.Model.extend({
    bot: true,

    initialize: function () {
      PrisonersDilemma.Model.prototype.initialize.call(this);
      if (this.get("alias") === undefined) {
        this.set("alias", "bot");
      }

      // random delay before playing
      setTimeout(_.bind(this.play, this), Math.floor(Math.random()*500)+200);
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

    play: function () {
      var choice = Math.floor(Math.random() * 2) === 0 ? "A" : "B";
      this.set("choice", choice);
    }
  });

  PrisonersDilemma.Collection = Participant.Collection.extend({
    url: null,
    model: PrisonersDilemma.Model,

    initialize: function (models, options) {
      options = options || {};
      options.validateOnChoice = true;
      Participant.Collection.prototype.initialize.apply(this, [models, options]);
      this.on("reset", this.pairModels);
      this.pairModels(models);
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

      console.log("pairing models", models, indices);
    },
  })


  PrisonersDilemma.Views.Play.Participant = Backbone.View.extend({
  	template: "pd/play/participant",
    tagName: "div",
    className: "participant",
    playedClass: "played",


  	serialize: function () {
  		return { model: this.model };
  	},

    beforeRender: function () {
      var played = this.model.get("played");
      // remove old choice classes and set new one
      if (played) {
        this.$el.addClass(this.playedClass);
      } else {
        this.$el.removeClass(this.playedClass);
      }

    },

  	initialize: function () {
  		this.listenTo(this.model, "change", this.render);
  	}
  });

  PrisonersDilemma.Views.Play.Participants = Backbone.View.extend({
    template: "pd/play/layout",

    serialize: function () {
      return { hasPlayers: (this.collection.length > 0) };
    },

  	beforeRender: function () {
      this.collection.each(function (participant) {
  			this.insertView(".participant-grid", new PrisonersDilemma.Views.Play.Participant({ model: participant }));
  		}, this);
  	},


  	initialize: function () {
      app.participantServer.hookCollection(this.collection, this);

      this.listenTo(this.collection, {
  			"reset": this.render
  		});
      app.setTitle("Prisoners Dilemma");
  	},
  });

  PrisonersDilemma.Views.Results.Participant = Backbone.View.extend({
    template: "pd/results/participant",
    tagName: "div",
    className: "participant results",


    serialize: function () {
      return { model: this.model };
    },

    beforeRender: function () {
      var choice = this.model.get("choice");
      var pairChoices = this.model.get("pairChoices");

      this.$el.addClass("choices-"+pairChoices);
    },

    initialize: function () {
      this.listenTo(this.model, "change", this.render);
    }
  });

  PrisonersDilemma.Views.Results.Participants = Backbone.View.extend({
    className: "participant-grid",

    beforeRender: function () {
      this.collection.each(function (participant) {
        this.insertView(new PrisonersDilemma.Views.Results.Participant({ model: participant }));
      }, this);
    },


    initialize: function () {
      this.listenTo(this.collection, {
        "reset": this.render
      });
    }
  });

  PrisonersDilemma.Views.Results.Stats = Backbone.View.extend({
    template: "pd/results/stats",

    tooltipTemplate: '<h3><%= label %></h3>'
      + '<div class="value"><span class="value"><%= value.toFixed(1) %></span> '
      + '<span class="total-value">(<span class="<%= (value < totalAverage) ? "below" : "above" %>"><%= (value - totalAverage).toFixed(1) %></span>)</span>'
      + '</div>'
      + '<div class="count"><%= count %> <% if (count === 1) { print("person") } else { print("people") } %></div>',

    calculateStats: function () {
      // models partitioned by choice
      var groups = this.collection.groupBy(function (model) { return model.get("choice"); });
      groups.A || (groups.A = []);
      groups.B || (groups.B = []);

      function average(modelsArray) {
        if (modelsArray.length === 0) return 0;
        return _.reduce(modelsArray, function(memo, model) { return memo + model.get("score"); }, 0) / modelsArray.length;
      }

      return {
        A: {
          count: groups.A.length,
          average: average(groups.A)
        },
        B: {
          count: groups.B.length,
          average: average(groups.B)
        },
        total: {
          count: this.collection.length,
          average: average(this.collection.models)
        }
      }
    },

    beforeRender: function () {
      this.stats = this.calculateStats();
    },

    serialize: function () {
      return this.stats;
    },

    afterRender: function () {

      var chartData = [ {
          label: "A - Silent",
          value: this.stats.A.average,
          count: this.stats.A.count
        }, {
          label: "B - Talked",
          value: this.stats.B.average,
          count: this.stats.B.count
        }
      ];


      var chart = variableWidthBarChart()
        .tooltip(_.template(this.tooltipTemplate), {
          totalAverage: this.stats.total.average
        });

      d3.select(".results-chart").datum(chartData).call(chart);

      // add in average line
      var avgLine = xLine()
        .y(function (d) { return chart.yScale(d); })
        .width(chart.innerWidth());

      d3.select(".results-chart .chart-data").datum([this.stats.total.average]).call(avgLine);
    },


    initialize: function () {

    }
  });

  PrisonersDilemma.Views.Results.Layout = Backbone.View.extend({
    template: "pd/results/results",

    serialize: function () {
      return { hasPlayers: (this.collection.length > 0) };
    },

    beforeRender: function () {
      if (this.collection.length) {
        this.setViews({
          ".results-participants": new PrisonersDilemma.Views.Results.Participants({ collection: this.collection }),
          ".results-stats": new PrisonersDilemma.Views.Results.Stats({ collection: this.collection })
        });
      }
    },


    initialize: function () {
      this.listenTo(this.collection, {
        "reset": this.render
      });
      app.setTitle("Prisoners Dilemma: Results");
    }
  });


  // To be used in StateApps
  PrisonersDilemma.States = {};
  PrisonersDilemma.States.Play = function (options) {
    this.options = _.defaults({}, options, this.defaults);

    this.initialize();
  }
  PrisonersDilemma.States.Play.prototype = new StateApp.State(PrisonersDilemma.Views.Play.Participants);
  _.extend(PrisonersDilemma.States.Play.prototype, {
    defaults: {
      defaultChoice: "A" // choice made when a player does not play
    },

    initialize: function () {
    },

    beforeRender: function () {
      // create PD Participants from these Participant Models
      var pdParticipants = this.input.map(function (participant) {
        return new PrisonersDilemma.Model({ alias: participant.get("alias") });
      });
      // ensure we have even number of participants by adding a bot
      if (pdParticipants.length % 2 === 1) {
        pdParticipants.push(new PrisonersDilemma.Bot());
      }

      this.participants = new PrisonersDilemma.Collection(pdParticipants);

      this.options.viewOptions = { collection: this.participants };
    },

    // outputs a PrisonersDilemma.Collection
    getOutput: function () {
      // if you haven't played, then you played "A".
      this.participants.each(function (participant) {
        if (participant.get("choice") === undefined) {
          participant.set("choice", this.options.defaultChoice);
        }
      }, this);

      return this.participants;
    }
  });
  PrisonersDilemma.States.Results = function (options) {
    this.options = _.defaults({}, options, this.defaults);
    this.initialize();
  }
  PrisonersDilemma.States.Results.prototype = new StateApp.State(PrisonersDilemma.Views.Results.Layout);
  _.extend(PrisonersDilemma.States.Results.prototype, {
    defaults: {
      scoringMatrix: {
        AA: [ 70, 70 ],
        AB: [ 20, 100 ],
        BA: [ 100, 20 ],
        BB: [ 0, 0 ]
      }
    },

    initialize: function () {
    },

    assignScores: function (models) {
      models.each(function (model) {
        var pairChoices = model.get("choice") + model.get("partner").get("choice");
        model.set({"score": this.options.scoringMatrix[pairChoices][0], "pairChoices": pairChoices});
      }, this);
    },

    beforeRender: function () {
      // this.input is a PrisonersDilemma.Collection
      this.options.viewOptions = { collection: this.input };

      // calculate the scores
      this.assignScores(this.input);


    },

    getOutput: function () { }
  })

  return PrisonersDilemma;
});