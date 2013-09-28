define([
	"framework/App",
	"framework/modules/common/Common",
	"framework/util/d3/rickshaw/graphs",

	"apps/PrisonersDilemma/Module",
	"apps/PrisonersDilemmaMulti/Base"
],
function (App, Common, Graphs, PrisonersDilemma, PrisonersDilemmaMulti) {

	var PrisonersDilemmaMultiViews = {};

	PrisonersDilemmaMultiViews.Configure = Common.Views.ModelConfigure.Layout.extend({
		modelOptions: _.clone(PrisonersDilemmaMulti.config)
	});

	PrisonersDilemmaMultiViews.AppControls = Common.Views.AppControls.extend({
		AppConfigView: PrisonersDilemmaMultiViews.Configure
	});

	PrisonersDilemmaMultiViews.Results = {};

	PrisonersDilemmaMultiViews.Results.TimeSeries = App.BaseView.extend({
		template: "framework/templates/common/chart",

		serialize: function () {
			return this.options.stats;
		},

		afterRender: function () {
			this.renderTimeSeries();
		},

		renderTimeSeries: function () {
			var numRounds = this.options.stats.length;
			var cooperateData = _.pluck(this.options.stats, "cooperate");
			var defectData = _.pluck(this.options.stats, "defect");

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
					tickFormat: function (n) {
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
	});

	// choose between bar chart or time series depending on data available
	PrisonersDilemmaMultiViews.Results.Chart = App.BaseView.extend({
		beforeRender: function () {
			if (this.options.stats) {
				if (this.options.stats.length > 1) {
					this.insertView(new PrisonersDilemmaMultiViews.Results.TimeSeries(this.options));
				} else {
					this.insertView(new PrisonersDilemma.Views.Results.BarChart(_.extend({}, this.options, { stats: this.options.stats[0] })));
				}
			}
		}
	});


	PrisonersDilemmaMultiViews.Results.Layout =  App.registerView("pdm::results", Common.Mixins.mixin(["gameOver", "rounds"],
		PrisonersDilemma.Views.Results.Layout.extend({
			PostParticipantsView: PrisonersDilemmaMultiViews.Results.Chart
		})
	));

	PrisonersDilemmaMultiViews.Play = {};

	PrisonersDilemmaMultiViews.Play.Layout = App.registerView("pdm::play", Common.Mixins.rounds(PrisonersDilemma.Views.Play.Layout.extend({
		PostParticipantsView: PrisonersDilemmaMultiViews.Results.Chart
	})));

	return PrisonersDilemmaMultiViews;
});