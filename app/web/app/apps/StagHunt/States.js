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

	StagHuntStates.Score = Common.States.GroupScore.extend({
		assignScore: function (model) {
			Common.Util.Scoring.matrix(this.config.scoringMatrix, model);
		},

		onExit: function () {
			var result = Common.States.GroupScore.prototype.onExit.call(this);

			// calculate phase total
			Common.Util.Totals.groupPhase(this.groupModel, this.options.parentOptions.roundOutputs);

			return result;
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
					pairChoices: participant.get("pairChoices"),
					partner: participant.get("partner").get("alias")
				};
			}
		},

		onEntry: function (input, prevState) {
			input.groupModel.get("participants").each(function (participant) {
				participant.set({ "phaseTotal": 0, "score": null}); // must reset score to prevent "prevScore" from showing up
			});

			StateApp.RepeatState.prototype.onEntry.apply(this, arguments);
		},
	});

	StagHuntStates.PhaseTotalBucket = Common.States.Bucket.extend({
		bucketAttribute: "phaseTotal",
	});

	StagHuntStates.PhaseResults = Common.States.GroupResults.extend({
		name: "phase-results",
		view: "stag-hunt::phase-results",
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

	StagHuntStates.TotalResults = Common.States.GroupResults.extend({
		name: "total-results",
		view: "stag-hunt::total-results",

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

	return StagHuntStates;
});