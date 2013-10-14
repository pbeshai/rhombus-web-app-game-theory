define([
	"framework/App",
	"framework/modules/common/Common",
	"framework/modules/StateApp/Module",

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

	PrisonersDilemmaMultiStates.Results = Common.States.Results.extend({
		view: "pdm::results",
		viewOptions: function () {
			var viewOptions = PrisonersDilemma.States.Play.prototype.viewOptions.apply(this, arguments);
			viewOptions.stats = this.input.stats;
			return viewOptions;
		},

		onExit: function () {
			// reuse the input message to keep stats moving forward
			return this.input;
		}
	});

	PrisonersDilemmaMultiStates.Score = Common.States.RoundScore.extend({
		assignScore: function (model) {
			Common.Util.Scoring.matrix(this.config.scoringMatrix, model);
		}
	});


	PrisonersDilemmaMultiStates.Round = Common.States.Round.extend({
		States: [ PrisonersDilemmaMultiStates.Play, PrisonersDilemmaMultiStates.Score, PrisonersDilemmaMultiStates.Stats, Common.States.Bucket, PrisonersDilemmaMultiStates.Results ],
	});

	PrisonersDilemmaMultiStates.Phase = Common.States.Phase.extend({
		State: PrisonersDilemmaMultiStates.Round,
		minRounds: PrisonersDilemmaMulti.config.minRounds,
		maxRounds: PrisonersDilemmaMulti.config.maxRounds,
	});

	PrisonersDilemmaMultiStates.PhaseTotalBucket = Common.States.Bucket.extend({
		bucketAttribute: "phaseTotal",
	});

	PrisonersDilemmaMultiStates.PhaseResults = Common.States.PhaseResults.extend({
		view: "pdm::phase-results",
	});

	return PrisonersDilemmaMultiStates;
});