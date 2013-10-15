define([
	"framework/App",
	"framework/modules/common/Common",
	"framework/modules/StateApp/Module",

	"apps/PrisonersDilemma/Base",
	"apps/PrisonersDilemma/Views"
],
function (App, Common, StateApp, PrisonersDilemma) {

	var PrisonersDilemmaStates = {};

	// To be used in StateApps
	PrisonersDilemmaStates = {};
	PrisonersDilemmaStates.Score = Common.States.Score.extend({
		assignScore: function (model) {
			var pairChoices = model.get("choice") + model.get("partner").get("choice");
			model.set({
				"score": this.config.scoringMatrix[pairChoices],
				"pairChoices": pairChoices
			});
		},
	});

	PrisonersDilemmaStates.Stats = Common.States.Stats.extend({
		calculateStats: function (participants) {
			var groups = this.group(participants, "choice");
			var stats = {
				cooperate: {
					count: this.count(groups.C),
					average: this.average(groups.C, "score")
				},
				defect: {
					count: this.count(groups.D),
					average: this.average(groups.D, "score")
				},
				total: {
					count: this.count(participants),
					average: this.average(participants, "score")
				}
			};

			return stats;
		}
	});

	PrisonersDilemmaStates.Play = Common.States.Play.extend({
		view: "pd::play",
		defaultChoice: "C",
		validChoices: ["C", "D"],
		botStrategy: "C"
	});

	PrisonersDilemmaStates.Results = Common.States.Results.extend({
		view: "pd::results",

		viewOptions: function () {
			var viewOptions = Common.States.Results.prototype.viewOptions.apply(this, arguments);
			viewOptions.stats = this.input.stats;
			return viewOptions;
		},

		logResults: function () {
			var results = this.participants.map(function (model) {
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
			});

			return { results: results };
		},
	});

	return PrisonersDilemmaStates;
});