/**

	Coin Matching for Peter Danielson's COGS 300 class

*/
define([
	// Application.
	"framework/App",
	"framework/modules/common/Common",
	"framework/modules/StateApp/Module",

	"apps/CoinMatching/Base",
	"apps/CoinMatching/Views" // depends on Views to register themselves
],
function (App, Common, StateApp, CoinMatching) {


	// To be used in StateApps
	var CoinMatchingStates = {};

	CoinMatchingStates.Play = Common.States.GroupPlay.extend({
		view: "coin-matching::play",
		defaultChoice: null,
		validChoices: ["A", "B"],

		prepareParticipantGroup1: function (participant) {
			this.prepareParticipant(participant, "group1");
			participant.set("role", "row");
		},

		prepareParticipantGroup2: function (participant) {
			this.prepareParticipant(participant, "group2");
			participant.set("role", "col");
		},
	});

	CoinMatchingStates.Score = Common.States.GroupRoundScore.extend({
		assignScoreGroup2: function () { }, // do nothing (handled in group1)
		// group 1 is row, group2 is col
		assignScoreGroup1: function (participant) {
			var partner = participant.get("partner");
			var choice = participant.get("choice"), partnerChoice = partner.get("choice");
			var pairChoice = choice + partnerChoice;
			var score = 0, partnerScore = 0;
			var rowWin = [ "AA", "BB", "CC", "DD", "AC", "CA", "BD", "DB" ];
			var colWin = [ "AB", "BA", "CD", "DC", "AD", "DA", "CB", "BC" ];

			if (_.contains(rowWin, pairChoice) || (choice != null && partnerChoice == null)) {
				score = this.config.pointsPerRound;
			} else if (_.contains(colWin, pairChoice) || (choice == null && partnerChoice != null)) {
				partnerScore = this.config.pointsPerRound;
			}

			participant.set({ "score": score });
			partner.set({ "score": partnerScore });
		},
	});

	CoinMatchingStates.Results = Common.States.GroupResults.extend({
		view: "coin-matching::results",
	});

	CoinMatchingStates.Partner = Common.States.GroupPartner;


	CoinMatchingStates.Round = Common.States.Round.extend({
		States: [ CoinMatchingStates.Play, CoinMatchingStates.Score, Common.States.Bucket, CoinMatchingStates.Results ],
	});

	CoinMatchingStates.Phase = Common.States.Phase.extend({
		State: CoinMatchingStates.Round,
		numRounds: CoinMatching.config().roundsPerPhase,
	});

	CoinMatchingStates.PhaseTotalBucket = Common.States.Bucket.extend({
		bucketAttribute: "phaseTotal",
	});

	CoinMatchingStates.TotalBucket = Common.States.Bucket.extend({ bucketAttribute: "total" });

	CoinMatchingStates.PhaseResults = Common.States.GroupPhaseResults.extend({
		view: "coin-matching::phase-results",
	});

	CoinMatchingStates.TotalResults = Common.States.GroupTotalPhaseResults.extend({
		view: "coin-matching::total-results",
	});

	return CoinMatchingStates;
});