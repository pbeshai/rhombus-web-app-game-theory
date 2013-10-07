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

		viewOptions: function () {
			var viewOptions = Common.States.GroupPlay.prototype.viewOptions.apply(this, arguments);
			viewOptions.round = this.options.round;
			return viewOptions;
		}
	});

	CoinMatchingStates.Score = Common.States.GroupScore.extend({
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

		onExit: function () {
			var result = Common.States.GroupScore.prototype.onExit.call(this);
			// save the phase total (we need to do this before results since we show the phase total there)
			this.groupModel.get("group1").each(function (participant, i) {
				// sum up total scores from rounds in this phase
				var phaseTotal = _.reduce(this.options.parentOptions.roundOutputs, function (memo, roundOutput) {
					var participantOutput = roundOutput.group1[i];
					if (participantOutput && participantOutput.alias === participant.get("alias")) {
						return participantOutput.score + memo;
					} else {
						return memo;
					}

				}, 0) + participant.get("score");
				participant.set("phaseTotal", phaseTotal);
			}, this);

			this.groupModel.get("group2").each(function (participant, i) {
				// sum up total scores from rounds in this phase
				var phaseTotal = _.reduce(this.options.parentOptions.roundOutputs, function (memo, roundOutput) {
					var participantOutput = roundOutput.group2[i];
					if (participantOutput && participantOutput.alias === participant.get("alias")) {
						return participantOutput.score + memo;
					} else {
						return memo;
					}
				}, 0) + participant.get("score");
				participant.set("phaseTotal", phaseTotal);
			}, this);

			return result;
		}
	});

	CoinMatchingStates.Results = Common.States.GroupResults.extend({
		view: "coin-matching::results",
		viewOptions: function () {
			var viewOptions = Common.States.GroupResults.prototype.viewOptions.apply(this, arguments);
			viewOptions.round = this.options.round;
			return viewOptions;
		},
	});

	CoinMatchingStates.Partner = Common.States.GroupPartner;


	CoinMatchingStates.Round = Common.States.Round.extend({
		States: [ CoinMatchingStates.Play, CoinMatchingStates.Score, Common.States.Bucket, CoinMatchingStates.Results ],
	});

	CoinMatchingStates.Phase = Common.States.Phase.extend({
		State: CoinMatchingStates.Round,
		numRounds: CoinMatching.config.roundsPerPhase,

		// what is saved between each round
		// output is a groupModel
		roundOutput: function (output) {
			var roundOutput = {
				group1: output.groupModel.get("group1").map(serialize),
				group2: output.groupModel.get("group2").map(serialize)
			};

			return roundOutput;

			function serialize(participant) {
				return {
					alias: participant.get("alias"),
					choice: participant.get("choice"),
					score: participant.get("score"),
					partner: participant.get("partner").get("alias")
				};
			}
		},

		onEntry: function (input, prevState) {
			input.groupModel.get("participants").each(function (participant) {
				participant.set({ "phaseTotal": 0, "score": null}); // must reset score to prevent prev score from showing up
			});

			StateApp.RepeatState.prototype.onEntry.apply(this, arguments);
		},
	});

	CoinMatchingStates.PhaseTotalBucket = Common.States.Bucket.extend({
		bucketAttribute: "phaseTotal",
	});

	CoinMatchingStates.TotalBucket = Common.States.Bucket.extend({ bucketAttribute: "total" });

	CoinMatchingStates.PhaseResults = Common.States.GroupResults.extend({
		name: "phase-results",
		view: "coin-matching::phase-results",
		beforeRender: function () {
			Common.States.GroupResults.prototype.beforeRender.call(this);

			// save the phaseTotal on the participant as phase#Total
			this.groupModel.get("participants").each(function (participant, i) {
				participant.set("phase" + this.options.phase + "Total", participant.get("phaseTotal"));
			}, this);
		},

		logResults: function () {
			var logData = {};
			logData["phase" + this.options.phase] = {
				results: this.input.roundOutputs,
				config: this.config
			};
			return logData;
		}
	});

	CoinMatchingStates.TotalResults = Common.States.GroupResults.extend({
		name: "total-results",
		view: "coin-matching::total-results",

		beforeRender: function () {
			Common.States.GroupResults.prototype.beforeRender.call(this);

			this.groupModel.get("participants").each(function (participant) {
				participant.set("total", 0);
				for (var i = 0; i < this.options.numPhases; i++) {
					var phaseTotal = participant.get("phase" + (i+1) + "Total");
					if (phaseTotal) {
						participant.set("total", participant.get("total") + phaseTotal);
					}
				}
			}, this);
			this.groupModel.get("participants").bucket("total", 6);
		},
	});

	return CoinMatchingStates;
});