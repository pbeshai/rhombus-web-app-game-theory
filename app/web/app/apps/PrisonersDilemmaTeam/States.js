define([
	"framework/App",
	"framework/modules/common/Common",
	"framework/modules/StateApp/Module",

	"apps/PrisonersDilemmaTeam/Base",
	"apps/PrisonersDilemmaTeam/Views" // depends on Views to register themselves
],
function (App, Common, StateApp, PrisonersDilemmaTeam) {


	// To be used in StateApps
	var PrisonersDilemmaTeamStates = {};

	PrisonersDilemmaTeamStates.Play = Common.States.GroupPlay.extend({
		view: "teampd::play",
		defaultChoice: "C",
		validChoices: ["C", "D"],
		botStrategy: "C"
	});

	PrisonersDilemmaTeamStates.Score = Common.States.GroupRoundScore.extend({
		assignScore: function (model) {
			Common.Util.Scoring.matrix(this.config.scoringMatrix, model);
		}
	});

	PrisonersDilemmaTeamStates.Results = Common.States.GroupResults.extend({
		view: "teampd::results",
	});

	PrisonersDilemmaTeamStates.Partner = Common.States.GroupPartner;


	PrisonersDilemmaTeamStates.Round = Common.States.Round.extend({
		States: [ PrisonersDilemmaTeamStates.Play, PrisonersDilemmaTeamStates.Score, Common.States.Bucket, PrisonersDilemmaTeamStates.Results ],
	});

	PrisonersDilemmaTeamStates.Phase = Common.States.Phase.extend({
		State: PrisonersDilemmaTeamStates.Round,
		numRounds: PrisonersDilemmaTeam.config.roundsPerPhase,
	});

	PrisonersDilemmaTeamStates.PhaseTotalBucket = Common.States.Bucket.extend({
		bucketAttribute: "phaseTotal",
	});

	PrisonersDilemmaTeamStates.PhaseResults = Common.States.GroupPhaseResults.extend({
		view: "teampd::phase-results",
	});

	PrisonersDilemmaTeamStates.TotalResults = Common.States.GroupTotalPhaseResults.extend({
		view: "teampd::total-results",
	});

	return PrisonersDilemmaTeamStates;
});