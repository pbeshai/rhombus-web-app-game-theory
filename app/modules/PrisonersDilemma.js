/**

	A simple grid app for displaying choices

*/
define([
  // Application.
  "app",

  "modules/common/Common",

  "modules/Participant",

  "apps/StateApp",

  "util/d3/variableWidthBarChart",
  "util/d3/xLine",

  "util/d3/rickshaw/graphs"
],
function(app, Common, Participant, StateApp, variableWidthBarChart, xLine, Graphs) {

  var PrisonersDilemma = app.module();
  PrisonersDilemma.Views.Play = {};
  PrisonersDilemma.Views.Results = {};


  PrisonersDilemma.Instructions = Common.Models.Instructions.extend({
    description: { template: "pd/play/instructions" },
    buttonConfig: {
      "C": { description: "Cooperate" },
      "D": { description: "Defect" },
    }
  });

  PrisonersDilemma.Model = Participant.Model.extend({
    urlRoot: null,

    defaults: {
      "played": false,
      "partner": null,
      "score": null,
      "complete": false
    },

    validate: function (attrs, options) {
      if (attrs.choice !== "C" && attrs.choice !== "D") {
        return "invalid choice " + attrs.choice + ". valid choices are C or D.";
      }
    },
  });


  PrisonersDilemma.Bot = PrisonersDilemma.Model.extend({
    bot: true,

    initialize: function () {
      PrisonersDilemma.Model.prototype.initialize.call(this);
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
      var choice = Math.floor(Math.random() * 2) === 0 ? "C" : "D";
      this.set("choice", choice);
    }
  });

  PrisonersDilemma.Collection = Participant.Collection.extend({
    url: null,
    model: PrisonersDilemma.Model,

    initialize: function (models, options) {
      options = _.defaults(options || {}, {
        validateOnChoice: true
      });
      Participant.Collection.prototype.initialize.apply(this, [models, options]);
      this.on("reset", this.pairModels);
      this.pairModels(models);
    }
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
      }
    },

    afterRender: function () {
      var played = this.model.get("played"), complete = this.model.get("complete");
      if (played && !complete) {
        this.$(".medium-text").hide().delay(200).fadeIn(400);
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


      this.insertView(new Common.Views.Instructions({ model: new this.options.InstructionsModel(null, { config: this.options.config }) }))
  	},


  	initialize: function () {
      app.participantServer.hookCollection(this.collection, this);

      this.options.InstructionsModel || (this.options.InstructionsModel = PrisonersDilemma.Instructions);

      this.listenTo(this.collection, {
  			"reset": this.render
  		});
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

    calculateStatsFromHistory: function () {
      if (this.collection.at(0).get("history") == null) return null;

      var histories = this.collection.map(function (model) { return model.get("history"); });
      var historySize = (histories[0] == null) ? 0 : histories[0].length;
      var byRound = _.zip.apply(this, histories);

      var stats = _.map(byRound, function (roundData) {
        var groups = group(roundData);
        var count = roundData.length;
        var round = roundData[0].round;

        return {
          round: round,
          cooperate: {
            count: groups.cooperate.length,
            average: average(groups.cooperate)
          },
          defect: {
            count: groups.defect.length,
            average: average(groups.defect)
          },
          total: {
            count: roundData.length,
            average: average(roundData)
          }
        };
      });

      function group(roundData) {
        var groups = _.groupBy(roundData, function (data) { return data.pairChoices[0] === "D" ? "defect" : "cooperate"; });
        groups.cooperate || (groups.cooperate = []);
        groups.defect || (groups.defect = []);

        return groups;
      }

      function average(roundData) {
        if (roundData.length === 0) return 0; // avoid division by 0
        return _.reduce(roundData, function (memo, data) { return memo + data.score; }, 0) / roundData.length;
      }

      return stats;
    },

    calculateStatsFromChoice: function () {
      // models partitioned by choice
      var groups = this.collection.groupBy(function (model) { return model.get("choice") === "D" ? "defect" : "cooperate"; });
      groups.cooperate || (groups.cooperate = []);
      groups.defect || (groups.defect = []);

      function average(modelsArray) {
        if (modelsArray.length === 0) return 0; // avoid division by 0
        return _.reduce(modelsArray, function(memo, model) { return memo + model.get("score"); }, 0) / modelsArray.length;
      }

      return {
        cooperate: {
          count: groups.cooperate.length,
          average: average(groups.cooperate)
        },
        defect: {
          count: groups.defect.length,
          average: average(groups.defect)
        },
        total: {
          count: this.collection.length,
          average: average(this.collection.models)
        }
      }
    },

    calculateStats: function () {
      var stats = this.calculateStatsFromHistory();
      if (stats == null) { // backwards compatibility
        stats = [this.calculateStatsFromChoice()];
      }
      return stats;
    },

    beforeRender: function () {
      this.stats = this.calculateStats();
    },

    serialize: function () {
      return this.stats;
    },

    afterRender: function () {
      if (this.stats.length > 1) {
        this.renderTimeSeries();
      } else {
        this.renderBarChart();
      }
    },

    renderBarChart: function () {
      var stats = this.stats[0];
      var chartData = [ {
          label: "C - Cooperated",
          value: stats.cooperate.average,
          count: stats.cooperate.count
        }, {
          label: "D - Defected",
          value: stats.defect.average,
          count: stats.defect.count
        }
      ];


      var chart = variableWidthBarChart()
        .tooltip(_.template(this.tooltipTemplate), {
          totalAverage: stats.total.average
        });

      d3.select(".chart").datum(chartData).call(chart);

      // add in average line
      var avgLine = xLine()
        .y(function (d) { return chart.yScale(d); })
        .width(chart.innerWidth());

      d3.select(".chart .chart-data").datum([stats.total.average]).call(avgLine);
    },

    renderTimeSeries: function () {
      var numRounds = this.stats.length;
      var cooperateData = _.pluck(this.stats, "cooperate");
      var defectData = _.pluck(this.stats, "defect");

      function formatData(data) {
        return _.map(data, function (elem, i) {
          return {
            x: i+1,
            y: elem.average,
            aux: elem.count + " people",
          };
        });
      }

      var timeSeries = Graphs.createTimeSeries(this, {
        graph: {
          element: this.$(".chart")[0],
          interpolation: "linear",
          series: [
            {
              data: formatData(cooperateData),
              name: 'Cooperated',
              className: "cooperated"
            }, {
              data: formatData(defectData),
              name: 'Defected',
              className: "defected"
            },
          ]
        },
        xAxis: {
          ticks: numRounds,
          tickFormat: function(n) {
            if (Math.floor(n) === n) {
              return "Round " + n;
            }
          }
        },
        yAxis: {
          ticks: 5
        },

        hover: {
          xFormatter: function (n) { return "Round " + n; }
        }
      });
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
    }
  });


  PrisonersDilemma.Views.Configure = Backbone.View.extend({
    template: "pd/configure",
    modelOptions: {
      scoringMatrix: {
        CC: 3,
        CD: 0,
        DC: 5,
        DD: 1
      }
    },

    events: {
      "change .pay-off-matrix input": "updateMatrix",
    },

    updateMatrix: function (evt) {
      // I guess ideally we would use a model for the scoring matrix to handle the lack of change notification
      // and ugly setting with a .get... but seems like too much hassle.
      this.model.get("scoringMatrix")[$(evt.target).data("quadrant")] = parseFloat(evt.target.value);
      this.model.trigger("change");
    },

    serialize: function () {
      return {
        scoringMatrix: this.model.get("scoringMatrix"),
      }
    },

    initialize: function () {
      // use defaults so we don't overwrite if already there
      _.defaults(this.model.attributes, this.modelOptions);
    }
  });

  PrisonersDilemma.Util = {};
  PrisonersDilemma.Util.convertModels = function (participantCollection) {
      var pdParticipants = participantCollection.map(function (participant) {
        return new PrisonersDilemma.Model({ alias: participant.get("alias") });
      });
      // ensure we have even number of participants by adding a bot
      if (pdParticipants.length % 2 === 1) {
        pdParticipants.push(new PrisonersDilemma.Bot());
      }

      return pdParticipants;
  };

  // converts a Participant.Collection to a PrisonersDilemma.Collection
  PrisonersDilemma.Util.makeCollection = function (participantCollection) {
      return new PrisonersDilemma.Collection(PrisonersDilemma.Util.convertModels(participantCollection));
  };

  // To be used in StateApps
  PrisonersDilemma.States = {};
  PrisonersDilemma.States.Play = function (options) {
    this.options = _.defaults({}, options, this.defaults);

    this.initialize();
  }
  PrisonersDilemma.States.Play.prototype = new StateApp.State(PrisonersDilemma.Views.Play.Participants);
  _.extend(PrisonersDilemma.States.Play.prototype, {
    defaults: {
      defaultChoice: "C" // choice made when a player does not play
    },

    initialize: function () {
      this.config = this.options.config;
    },

    beforeRender: function () {
      this.participants = PrisonersDilemma.Util.makeCollection(this.input);

      this.options.viewOptions = { collection: this.participants, config: this.config };
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
    this.options = _.defaults({}, options);
    this.initialize();
  }
  PrisonersDilemma.States.Results.prototype = new StateApp.State(PrisonersDilemma.Views.Results.Layout);
  _.extend(PrisonersDilemma.States.Results.prototype, {
    initialize: function () {
      this.config = this.options.config;
    },

    assignScores: function (models) {
      var scoringMatrix = this.config.scoringMatrix;
      models.each(function (model) {
        var pairChoices = model.get("choice") + model.get("partner").get("choice");
        model.set({"score": scoringMatrix[pairChoices], "pairChoices": pairChoices});
      }, this);
    },

    beforeRender: function () {
      // this.input is a PrisonersDilemma.Collection
      this.options.viewOptions = { collection: this.input };

      // calculate the scores
      this.assignScores(this.input);

      this.logResults(this.input);
    },

    logResults: function (models) {
      var results = models.map(function (model) {
        return {
          alias: model.get("alias"),
          choice: model.get("choice"),
          score: model.get("score"),
          partner: {
            alias: model.get("partner").get("alias"),
            choice: model.get("partner").get("choice"),
            score: model.get("partner").get("score"),
          },
        };
      });
      console.log("PD RESULTS = ", results);
      var logData = {
        results: results,
        config: this.config,
        version: this.stateApp.version
      };

      app.api({ call: "apps/pd/results", type: "post", data: logData });
    },

    getOutput: function () { }
  })

  return PrisonersDilemma;
});