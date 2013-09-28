define([
	"framework/App",
	"framework/modules/common/Common",

	"apps/PrisonersDilemma/Module",
	"apps/TeamPrisonersDilemma/Base",
],
function (App, Common, PrisonersDilemma, TeamPrisonersDilemma) {

	var TeamPrisonersDilemmaViews = {};

	TeamPrisonersDilemmaViews.Results = {};
	TeamPrisonersDilemmaViews.Play = {};

	TeamPrisonersDilemmaViews.Play.Layout = App.registerView("teampd::play", Common.Views.GroupLayout.extend({
		header: "Play",
		ParticipantView: PrisonersDilemma.Views.Play.Participant,
		InstructionsModel: PrisonersDilemma.Instructions
	}));

	TeamPrisonersDilemmaViews.Results.TeamStats = App.BaseView.extend({
		template: "app/apps/TeamPrisonersDilemma/templates/results/team_stats",
		serialize: function () {
			return this.options.groupStats;
		}
	});

	TeamPrisonersDilemmaViews.Results.Layout = App.registerView("teampd::results", Common.Views.GroupLayout.extend({
		header: "Results",
		PreHeaderView: PrisonersDilemma.Views.Results.Legend,
		ParticipantView: PrisonersDilemma.Views.Results.Participant,
		PostParticipantsView: TeamPrisonersDilemmaViews.Results.TeamStats,
		PostGroupsView: PrisonersDilemma.Views.Results.BarChart
	}));

	TeamPrisonersDilemmaViews.Configure = Backbone.View.extend({
		template: "app/apps/TeamPrisonersDilemma/templates/configure",
		modelOptions: _.clone(TeamPrisonersDilemma.config),

		beforeRender: function () {
			this.setView(".pd-configure", new PrisonersDilemma.Views.Configure({ model: this.model }));
			this.setView(".team-name-configure", new Common.Views.GroupConfigure({
				model: this.model,
				nameHeader: "Team Names",
				group1Label: "Team 1",
				group2Label: "Team 2"
			}));
		},

		initialize: function () {

			// use defaults so we don't overwrite if already there
			_.defaults(this.model.attributes, this.modelOptions);
		}
	});

	TeamPrisonersDilemmaViews.AppControls = Common.Views.AppControls.extend({
		AppConfigView: TeamPrisonersDilemmaViews.Configure
	});

	return TeamPrisonersDilemmaViews;
});