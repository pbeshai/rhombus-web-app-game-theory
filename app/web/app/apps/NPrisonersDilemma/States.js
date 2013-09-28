define([
	"framework/App",
	"framework/modules/common/Common",
	"framework/modules/StateApp/Module",

	"apps/PrisonersDilemma/Module",
	"apps/NPrisonersDilemma/Base",
	"apps/NPrisonersDilemma/Views"
],
function (App, Common, StateApp, PrisonersDilemma, NPrisonersDilemma) {

	var NPrisonersDilemmaStates = {};

	NPrisonersDilemmaStates.Play = PrisonersDilemma.States.Play.extend({
		view: "npd::play",
	});

	NPrisonersDilemmaStates.Score = Common.States.Score.extend({
		assignScores: function (models) {
			// See Goehring and Kahan (1976) The Uniform N-Person Prisoner's Dilemma Game : Construction and Test of an Index of Cooperation
			var R = this.config.Rratio*(models.length - 1); // 0 < R < N-1, closer to 1 means more incentive for cooperation
			var H = this.config.H; // score increment when gaining 1 more cooperator
			var I = R*H;
			var groups = models.groupBy(function (model) { return model.get("choice") === "D" ? "defect" : "cooperate"; });
			var numCooperators = (groups.cooperate === undefined) ? 0 : groups.cooperate.length;
			var numDefectors = (groups.defect === undefined) ? 0 : groups.defect.length;

			var cooperatorPayoff = Math.round(numCooperators * H);
			var defectorPayoff = Math.round((numCooperators + 1) * H + I);
			var totalPayoff = cooperatorPayoff * numCooperators + defectorPayoff * numDefectors;
			var maxPayoff = Math.round((models.length * H) * models.length); // everyone cooperates

			models.each(function (model) {
				var choice = model.get("choice");
				if (choice === "C") {
					model.set("score", cooperatorPayoff);
				} else {
					model.set("score", defectorPayoff);
				}
			}, this);

			this.payoff = {
				cooperatorPayoff: cooperatorPayoff,
				numCooperators: numCooperators,
				defectorPayoff: defectorPayoff,
				numDefectors: numDefectors,
				totalPayoff: totalPayoff,
				maxPayoff: maxPayoff
			};
		},

		onExit: function () {
			Common.States.Score.prototype.onExit.call(this);
			return this.input.clone({ payoff: this.payoff });
		}
	});

	NPrisonersDilemmaStates.Stats = PrisonersDilemma.States.Stats;

	NPrisonersDilemmaStates.Results = Common.States.Results.extend({
		view: "npd::results",

		beforeRender: function () {
			Common.States.Results.prototype.beforeRender.call(this);
			console.log("input", this.input);
			this.payoff = this.input.payoff;
		},

		viewOptions: function () {
			var options = Common.States.Results.prototype.viewOptions.call(this);
			options.payoff = this.payoff;
			options.stats = this.input.stats;
			return options;
		},

		logResults: function () {
			var results = this.participants.map(function (model) {
				return {
					alias: model.get("alias"),
					choice: model.get("choice"),
					score: model.get("score"),
				};
			});
			return { results: results, payoff: this.payoff };
		},
	});

	return NPrisonersDilemmaStates;
});