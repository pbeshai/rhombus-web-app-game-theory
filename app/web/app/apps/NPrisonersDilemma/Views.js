/**

	A simple grid app for displaying choices

*/
define([
	// Application.
	"framework/App",
	"framework/modules/common/Common",

	"apps/PrisonersDilemma/Module",
	"apps/NPrisonersDilemma/Base",
],
function (App, Common, PrisonersDilemma, NPrisonersDilemma) {

	var NPrisonersDilemmaViews = {};

	// can't pass the instructions model over the socket, so override it instead of using a view option
	NPrisonersDilemmaViews.Play = App.registerView("npd::play", PrisonersDilemma.Views.Play.Layout.extend({
		InstructionsModel: NPrisonersDilemma.Instructions
	}));

	NPrisonersDilemmaViews.Results = {};

	NPrisonersDilemmaViews.Results.Participant = Common.Views.ParticipantDisplay.extend({
		cssClass: function () {
			return "big-message results choice-" + this.model.get("choice");
		}
	});

	NPrisonersDilemmaViews.Results.Stats = App.BaseView.extend({
		template: "app/apps/NPrisonersDilemma/templates/results/stats",

		serialize: function () {
			return {
				payoff: this.options.payoff
			};
		},

		beforeRender: function () {
			if (this.participants.length) {
				this.setView(".results-stats", new PrisonersDilemma.Views.Results.BarChart({ participants: this.participants, stats: this.options.stats }));
			}
		},
	});

	NPrisonersDilemmaViews.Results.Layout = App.registerView("npd::results", Common.Views.SimpleLayout.extend({
		PreHeaderView: PrisonersDilemma.Views.Results.Legend,
		ParticipantView: NPrisonersDilemmaViews.Results.Participant,
		PostParticipantsView: NPrisonersDilemmaViews.Results.Stats
	}));

	NPrisonersDilemmaViews.Configure = Backbone.View.extend({
		template: "app/apps/NPrisonersDilemma/templates/configure",
		modelOptions: _.clone(NPrisonersDilemma.config),

		events: {
			"change #r-ratio-input": "updateRratio",
			"change #h-input": "updateH"
		},

		updateRratio: function (evt) {
			this.model.set("Rratio", $(evt.target).val());
		},

		updateH: function (evt) {
			this.model.set("H", $(evt.target).val());
		},

		serialize: function () {
			return {
				Rratio: this.model.get("Rratio"),
				H: this.model.get("H")
			};
		},

		initialize: function () {
			// use defaults so we don't overwrite if already there
			_.defaults(this.model.attributes, this.modelOptions);
		}
	});

	NPrisonersDilemmaViews.AppControls = Common.Views.AppControls.extend({
		AppConfigView: NPrisonersDilemmaViews.Configure
	});

	return NPrisonersDilemmaViews;
});