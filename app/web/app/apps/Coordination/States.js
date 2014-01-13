/**

	Coordination Game for Peter Danielson's COGS 300 class

*/
define([
	// Application.
	"framework/App",
	"framework/modules/common/Common",
	"framework/modules/StateApp/Module",

	"apps/Coordination/Base",
	"apps/Coordination/Views" // depends on Views to register themselves
],
function (App, Common, StateApp, Coordination) {


	// To be used in StateApps
	var CoordinationStates = {};

	CoordinationStates.Play = Common.States.GroupPlay.extend({
		view: "coordination::play",
		defaultChoice: "A",
		validChoices: ["A", "B"],
	});

	CoordinationStates.Score = Common.States.GroupRoundScore.extend({
		assignScore: function (participant) {
			var partner = participant.get("partner");
			var choice = participant.get("choice"), partnerChoice = partner.get("choice");
			var pairChoice = choice + partnerChoice;
			var score = 0;

			if (pairChoice === "AB" || pairChoice === "BA") {
				score = this.config.pointsPerRound;
			}

			participant.set({ "score": score });
		}
	});

	CoordinationStates.Results = Common.States.GroupResults.extend({
		view: "coordination::results",
	});

	CoordinationStates.Partner = Common.States.GroupPartner;


	CoordinationStates.Round = Common.States.Round.extend({
		States: [ CoordinationStates.Play, CoordinationStates.Score, Common.States.Bucket, CoordinationStates.Results ],
	});

	CoordinationStates.Phase = Common.States.Phase.extend({
		State: CoordinationStates.Round,
		numRounds: Coordination.config().roundsPerPhase,
	});

	CoordinationStates.PhaseTotalBucket = Common.States.Bucket.extend({
		bucketAttribute: "phaseTotal",
	});

	CoordinationStates.TotalBucket = Common.States.Bucket.extend({ bucketAttribute: "total" });

	CoordinationStates.PhaseResults = Common.States.GroupPhaseResults.extend({
		view: "coordination::phase-results",
	});

	CoordinationStates.TotalResults = Common.States.GroupTotalPhaseResults.extend({
		view: "coordination::total-results",
	});

	return CoordinationStates;
});