define([
	"framework/App",
	"framework/modules/common/Common",
	"framework/modules/StateApp/Module",

	"apps/StagHunt/Base",
	"apps/StagHunt/Views" // depends on Views to register themselves
],
function (App, Common, StateApp, StagHunt) {


	// To be used in StateApps
	var StagHuntStates = {};

	StagHuntStates.Play = Common.States.GroupPlay.extend({
		view: "stag-hunt::play",
		defaultChoice: "A",
		validChoices: ["A", "B"],
		botStrategy: "A"
	});

	StagHuntStates.Score = Common.States.GroupRoundScore.extend({
		assignScore: function (model) {
			Common.Util.Scoring.matrix(this.config.scoringMatrix, model);
		}
	});

	StagHuntStates.Results = Common.States.GroupResults.extend({
		view: "stag-hunt::results",
	});

	StagHuntStates.Partner = Common.States.GroupPartner;


	StagHuntStates.Round = Common.States.Round.extend({
		States: [ StagHuntStates.Partner, StagHuntStates.Play, StagHuntStates.Score, Common.States.Bucket, StagHuntStates.Results ],
	});

	StagHuntStates.Phase = Common.States.Phase.extend({
		State: StagHuntStates.Round,
		numRounds: StagHunt.config.roundsPerPhase,
	});

	StagHuntStates.PhaseTotalBucket = Common.States.Bucket.extend({
		bucketAttribute: "phaseTotal",
	});

	StagHuntStates.PhaseResults = Common.States.GroupPhaseResults.extend({
		view: "stag-hunt::phase-results",
	});

	StagHuntStates.TotalResults = Common.States.GroupTotalPhaseResults.extend({
		view: "stag-hunt::total-results",
	});

	return StagHuntStates;
});