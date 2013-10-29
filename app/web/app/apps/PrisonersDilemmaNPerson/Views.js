/**

	A simple grid app for displaying choices

*/
define([
	// Application.
	"framework/App",
	"framework/modules/common/Common",

	"apps/PrisonersDilemma/Module",
	"apps/PrisonersDilemmaNPerson/Base",
],
function (App, Common, PrisonersDilemma, PrisonersDilemmaNPerson) {

	var PrisonersDilemmaNPersonViews = {};

	// can't pass the instructions model over the socket, so override it instead of using a view option
	PrisonersDilemmaNPersonViews.Play = App.registerView("pdn::play", PrisonersDilemma.Views.Play.Layout.extend({
		InstructionsModel: PrisonersDilemmaNPerson.Instructions
	}));

	PrisonersDilemmaNPersonViews.Results = {};

	PrisonersDilemmaNPersonViews.Results.Participant = Common.Views.ParticipantDisplay.extend({
		cssClass: function () {
			return "big-message results choice-" + this.model.get("choice");
		},

		overlay: function (model) {
			var choices = this.model.get("choice") + this.model.get("choice");
			return "no-animate pd-choices-" + choices;
		}
	});

	PrisonersDilemmaNPersonViews.Results.Stats = App.BaseView.extend({
		template: "app/apps/PrisonersDilemmaNPerson/templates/results/stats",

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

	PrisonersDilemmaNPersonViews.Results.Layout = App.registerView("pdn::results", Common.Views.SimpleLayout.extend({
		PreHeaderView: PrisonersDilemma.Views.Results.Legend,
		ParticipantView: PrisonersDilemmaNPersonViews.Results.Participant,
		PostParticipantsView: PrisonersDilemmaNPersonViews.Results.Stats
	}));

	PrisonersDilemmaNPersonViews.Configure = Backbone.View.extend({
		template: "app/apps/PrisonersDilemmaNPerson/templates/configure",
		modelOptions: _.clone(PrisonersDilemmaNPerson.config),

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

	PrisonersDilemmaNPersonViews.AppControls = Common.Views.AppControls.extend({
		AppConfigView: PrisonersDilemmaNPersonViews.Configure
	});

	return PrisonersDilemmaNPersonViews;
});