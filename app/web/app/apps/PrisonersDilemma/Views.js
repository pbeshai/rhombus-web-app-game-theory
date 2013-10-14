define([
	"framework/App",
	"framework/modules/common/Common",
	"framework/util/d3/variableWidthBarChart",
	"framework/util/d3/xLine",
	"framework/util/d3/rickshaw/graphs",

	"apps/PrisonersDilemma/Base"
],
function (App, Common, variableWidthBarChart, xLine, Graphs, PrisonersDilemma) {

	var PrisonersDilemmaViews = {};

	PrisonersDilemmaViews.Play = {};
	PrisonersDilemmaViews.Results = {};

	PrisonersDilemmaViews.Play.Participant = Common.Views.ParticipantHiddenPlay;

	PrisonersDilemmaViews.Play.Layout = App.registerView("pd::play", Common.Views.SimpleLayout.extend({
		header: "Play",
		ParticipantView: PrisonersDilemmaViews.Play.Participant,
		InstructionsModel: PrisonersDilemma.Instructions.Play
	}));

	PrisonersDilemmaViews.Results.Participant = Common.Views.ParticipantDisplay.extend({
		template: "app/apps/PrisonersDilemma/templates/results/participant",
		cssClass: function (model) {
			return "results choices-" + model.get("pairChoices");
		},
		overlay: function (model) {
			return "no-animate pd-choices-" + model.get("pairChoices");
		}
	});
	PrisonersDilemmaViews.Results.Participant = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreChoiceDisplay.extend({
		labelChoice: PrisonersDilemma.Util.labelChoice,
		bucketChoiceMap: {
			"C" : "bucket-blue",
			"D" : "bucket-orange",
			"default" : "dark-dim"
		},
	}));

	PrisonersDilemmaViews.Results.PercentageBar = Common.Views.ChoicePercentageBar.extend({
		choices: {
			"C": { label: "Cooperate", key: "cooperate" },
			"D": { label: "Defect", key: "defect" },
			"null" : { label: "#", key: "choice-null" }
		}
	});

	PrisonersDilemmaViews.Results.BarChart = App.BaseView.extend({
		template: "framework/templates/common/chart",

		tooltipTemplate: '<h3><%= label %></h3>' +
			'<div class="value"><span class="value"><%= value.toFixed(1) %></span> ' +
			'<span class="total-value">(<span class="<%= (value < totalAverage) ? "below" : "above" %>"><%= (value - totalAverage).toFixed(1) %></span>)</span>' +
			'</div>' +
			'<div class="count"><%= count %> <% if (count === 1) { print("person") } else { print("people") } %></div>',

		serialize: function () {
			return this.options.stats;
		},

		afterRender: function () {
			this.renderBarChart();
		},

		renderBarChart: function () {
			var stats = this.options.stats;
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
	});

	PrisonersDilemmaViews.Results.Legend = Backbone.View.extend({
		template: "app/apps/PrisonersDilemma/templates/results/legend"
	});

	PrisonersDilemmaViews.Results.Layout = App.registerView("pd::results", Common.Views.SimpleLayout.extend({
		header: "Results",
		PreHeaderView: PrisonersDilemmaViews.Results.Legend,
		ParticipantView: PrisonersDilemmaViews.Results.Participant,
		PostParticipantsView: PrisonersDilemmaViews.Results.BarChart,
		InstructionsModel: PrisonersDilemma.Instructions.Results
	}));

	PrisonersDilemmaViews.Configure = Backbone.View.extend({
		template: "app/apps/PrisonersDilemma/templates/configure",
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
			};
		},

		initialize: function () {
			// use defaults so we don't overwrite if already there
			_.defaults(this.model.attributes, this.modelOptions);
		}
	});

	PrisonersDilemmaViews.AppControls = Common.Views.AppControls.extend({
		AppConfigView: PrisonersDilemmaViews.Configure
	});

	return PrisonersDilemmaViews;
});