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
  PrisonersDilemma.config = {
    scoringMatrix: {
      CC: 3,
      CD: 0,
      DC: 5,
      DD: 1
    }
  };

  PrisonersDilemma.Views.Play = {};
  PrisonersDilemma.Views.Results = {};

  PrisonersDilemma.Instructions = Common.Models.Instructions.extend({
    description: { template: "pd/play/instructions" },
    buttonConfig: {
      "C": { description: "Cooperate" },
      "D": { description: "Defect" },
    }
  });

  PrisonersDilemma.Views.Play.Participant = Common.Views.ParticipantHiddenPlay;

  PrisonersDilemma.Views.Play.Layout = Common.Views.SimpleLayout.extend({
    overrides: {
      ParticipantView: PrisonersDilemma.Views.Play.Participant,
      InstructionsModel: PrisonersDilemma.Instructions
    }
  });

  PrisonersDilemma.Views.Results.Participant = Common.Views.ParticipantDisplay.extend({
    template: "pd/results/participant",
    overrides: {
      cssClass: function () {
        return "results choices-" + this.model.get("pairChoices");
      }
    }
  })

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

  PrisonersDilemma.Views.Results.Layout = Common.Views.SimpleLayout.extend({
    overrides: {
      ParticipantView: PrisonersDilemma.Views.Results.Participant,
      PostParticipantsView: PrisonersDilemma.Views.Results.Stats
    }
  });

  PrisonersDilemma.Views.Configure = Backbone.View.extend({
    template: "pd/configure",
    modelOptions: _.clone(PrisonersDilemma.config),

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

  // To be used in StateApps
  PrisonersDilemma.States = {};
  PrisonersDilemma.States.Play = StateApp.defineState(Common.States.Play, {
    view: PrisonersDilemma.Views.Play.Layout,
    defaultChoice: "C",
    validChoices: ["C", "D"],
  });


  PrisonersDilemma.States.Results = StateApp.defineState(Common.States.Results, {
    view: PrisonersDilemma.Views.Results.Layout,

    assignScore: function (model) {
      var pairChoices = model.get("choice") + model.get("partner").get("choice");
      model.set({
        "score": this.config.scoringMatrix[pairChoices],
        "pairChoices": pairChoices
      });
    },

    logResults: function () {
      var results = this.collection.map(function (model) {
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

      this.log("apps/pd/results", { results: results });
    },
  })

  return PrisonersDilemma;
});