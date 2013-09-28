define([
	"framework/App",
	"framework/modules/common/Common",
	"framework/apps/StateApp",

	"apps/PrisonersDilemma/Module",
	"apps/PrisonersDilemmaMulti/Base",
	"apps/PrisonersDilemmaMulti/Views",
],
function (App, Common, StateApp, PrisonersDilemma, PrisonersDilemmaMulti) {

	var PrisonersDilemmaMultiStates = {};

	PrisonersDilemmaMultiStates.Play = PrisonersDilemma.States.Play.extend({
		view: "pdm::play",
		viewOptions: function () {
			var viewOptions = PrisonersDilemma.States.Play.prototype.viewOptions.apply(this, arguments);
			viewOptions.stats = this.input.stats;
			viewOptions.round = this.options.round;
			return viewOptions;
		}
	});

	PrisonersDilemmaMultiStates.Stats = PrisonersDilemma.States.Stats.extend({
		onExit: function () {
			var roundResults = this.options.parentOptions.roundOutputs.slice();

			// add in the current round's results
			roundResults.push(this.input.participants);

			// calculate stats
			var statsArray = _.map(roundResults, this.calculateStats, this);

			return this.input.clone({ stats: statsArray });
		}
	});

	PrisonersDilemmaMultiStates.Results = PrisonersDilemma.States.Results.extend({
		view: "pdm::results",
		beforeRender: function () {
			PrisonersDilemma.States.Results.prototype.beforeRender.call(this);
			this.config.gameOver = this.options.lastRound; // TODO: handle game over
		},

		viewOptions: function () {
			var viewOptions = PrisonersDilemma.States.Results.prototype.viewOptions.apply(this, arguments);
			viewOptions.round = this.options.round;
			return viewOptions;
		},

		logResults: function () {
			var results = this.participants.map(function (model, i) {
				return {
					alias: model.get("alias"),
					choice: model.get("choice"),
					score: model.get("score"),
					partner: {
						alias: model.get("partner").get("alias"),
						choice: model.get("partner").get("choice"),
						score: model.get("partner").get("score"),
					},
				};
			}, this);

			var logData = {};
			logData["round" + this.config.round] = results;
			return logData;
		},

		onExit: function () {
			// reuse the input message to keep stats moving forward
			return this.input;
		}
	});

	PrisonersDilemmaMultiStates.Round = Common.States.Round.extend({
		States: [ PrisonersDilemmaMultiStates.Play, PrisonersDilemma.States.Score, PrisonersDilemmaMultiStates.Stats, PrisonersDilemmaMultiStates.Results ],
	});

	PrisonersDilemmaMultiStates.Phase = Common.States.Phase.extend({
		State: PrisonersDilemmaMultiStates.Round,
		minRounds: PrisonersDilemmaMulti.config.minRounds,
		maxRounds: PrisonersDilemmaMulti.config.maxRounds,

		// what is saved between each round
		roundOutput: function (output) {
			var roundOutput = output.participants.map(PrisonersDilemma.Util.participantResults);
			return roundOutput;
		}
	});

	return PrisonersDilemmaMultiStates;
});