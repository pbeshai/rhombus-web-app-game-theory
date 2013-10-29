define([
	"framework/App",
	"framework/modules/common/Common",

	"apps/PrisonersDilemma/Module",
	"apps/PrisonersDilemmaTeam/Base",

],
function (App, Common, PrisonersDilemma, PrisonersDilemmaTeam) {

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

	PrisonersDilemmaTeamViews.Results.Layout = App.registerView("teampd::results", Common.Mixins.mixin(["rounds", "phaseTotals"], Common.Views.GroupLayout.extend({
		header: "Results",
		className: "teampd-results",
		PreHeaderView: PrisonersDilemma.Views.Results.Legend,
		ParticipantView: PrisonersDilemma.Views.Results.BucketParticipant,
		PreParticipantsView: PrisonersDilemma.Views.Results.PercentageBar,
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