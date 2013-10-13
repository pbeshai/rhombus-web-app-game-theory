define([
	"framework/App",
	"framework/modules/common/Common",

	"apps/PrisonersDilemmaTeam/Base"
],
function (App, Common, PrisonersDilemmaTeam) {

	var PrisonersDilemmaTeamViews = {};

	PrisonersDilemmaTeamViews.Configure = Common.Views.ModelConfigure.Layout.extend({
		modelOptions: _.extend({}, PrisonersDilemmaTeam.config)
	});

	PrisonersDilemmaTeamViews.AppControls = Common.Views.AppControls.extend({
		AppConfigView: PrisonersDilemmaTeamViews.Configure
	});

	PrisonersDilemmaTeamViews.Play = {};

	PrisonersDilemmaTeamViews.Play.Participant = Common.Views.ParticipantHiddenPlay;

	var total = Common.Util.Totals.total;


	PrisonersDilemmaTeamViews.Play.Layout = App.registerView("teampd::play", Common.Mixins.mixin(["rounds", "phaseTotals"], Common.Views.GroupLayout.extend({
		header: "Play",
		ParticipantView: PrisonersDilemmaTeamViews.Play.Participant,
		InstructionsModel: PrisonersDilemmaTeam.Instructions.Play,
	})));

	PrisonersDilemmaTeamViews.Results = {};

	PrisonersDilemmaTeamViews.Results.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreChoiceDisplay.extend({
		labelChoice: PrisonersDilemmaTeam.Util.labelChoice,
		bucketChoiceMap: {
			"C" : "bucket-blue",
			"D" : "bucket-orange",
			"default" : "dark-dim"
		},
	}));

	PrisonersDilemmaTeamViews.Results.Legend = Backbone.View.extend({
		template: "app/apps/PrisonersDilemma/templates/results/legend"
	});


	PrisonersDilemmaTeamViews.Results.PercentageBar = Common.Views.ChoicePercentageBar.extend({
		choices: {
			"C": { label: "Cooperate", key: "cooperate" },
			"D": { label: "Defect", key: "defect" },
			"null" : { label: "#", key: "choice-null" }
		}
	});

	PrisonersDilemmaTeamViews.Results.Layout = App.registerView("teampd::results", Common.Mixins.mixin(["rounds", "phaseTotals"], Common.Views.GroupLayout.extend({
		header: "Results",
		className: "teampd-results",
		PreHeaderView: PrisonersDilemmaTeamViews.Results.Legend,
		ParticipantView: PrisonersDilemmaTeamViews.Results.Score,
		PreParticipantsView: PrisonersDilemmaTeamViews.Results.PercentageBar,
		InstructionsModel: PrisonersDilemmaTeam.Instructions.Results
	})));


	PrisonersDilemmaTeamViews.PhaseResults = {};

	PrisonersDilemmaTeamViews.PhaseResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreDisplay.extend({
		scoreAttribute: "phaseTotal"
	}));

	PrisonersDilemmaTeamViews.PhaseResults.Layout = App.registerView("teampd::phase-results", Common.Mixins.phaseTotals(Common.Views.GroupLayout.extend({
		header: "Phase Total Results",
		className: "teampd-results",
		ParticipantView: PrisonersDilemmaTeamViews.PhaseResults.Score,
	})));


	PrisonersDilemmaTeamViews.TotalResults = {};

	PrisonersDilemmaTeamViews.TotalResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreDisplay.extend({
		scoreAttribute: "total"
	}));

	PrisonersDilemmaTeamViews.TotalResults.Layout = App.registerView("teampd::total-results", Common.Mixins.totals(Common.Views.GroupLayout.extend({
		header: "Total Results",
		className: "teampd-results",
		ParticipantView: PrisonersDilemmaTeamViews.TotalResults.Score,
	})));

	return PrisonersDilemmaTeamViews;
});