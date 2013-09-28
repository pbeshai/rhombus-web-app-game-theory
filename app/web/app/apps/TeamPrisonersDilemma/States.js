define([
	"framework/App",
	"framework/modules/common/Common",
	"framework/modules/StateApp/Module",

	"apps/PrisonersDilemma/Module",
	"apps/TeamPrisonersDilemma/Base",
	"apps/TeamPrisonersDilemma/Views"
],
function (App, Common, StateApp, PrisonersDilemma, TeamPrisonersDilemma) {

	var TeamPrisonersDilemmaStates = {};

	TeamPrisonersDilemmaStates.Group = Common.States.Group;

	TeamPrisonersDilemmaStates.Play = Common.States.GroupPlay.extend({
		view: "teampd::play",
		defaultChoice: "C", // choice made when a player does not play
		validChoices: ["C", "D"],
	});

	TeamPrisonersDilemmaStates.Score = Common.States.GroupScore.extend({
		assignScore: function (participant) {
			var pairChoices = participant.get("choice") + participant.get("partner").get("choice");
			participant.set({
				"score": this.config.scoringMatrix[pairChoices],
				"pairChoices": pairChoices
			});
		},
	});

	TeamPrisonersDilemmaStates.Stats = PrisonersDilemma.States.Stats.extend({
		name: "stats",
		onExit: function () {
			var overallStats = this.calculateStats(this.input.groupModel.get("participants"));
			var group1Stats = this.calculateStats(this.input.groupModel.get("group1"));
			var group2Stats = this.calculateStats(this.input.groupModel.get("group2"));

			return this.input.clone({ stats: { overall: overallStats, group1: group1Stats, group2: group2Stats } });
		},
	});

	TeamPrisonersDilemmaStates.Results = Common.States.GroupResults.extend({
		view: "teampd::results",

		viewOptions: function () {
			var viewOptions = Common.States.GroupResults.prototype.viewOptions.apply(this, arguments);
			viewOptions.stats = this.input.stats.overall;
			viewOptions.group1ViewOptions = { groupStats: this.input.stats.group1 };
			viewOptions.group2ViewOptions = { groupStats: this.input.stats.group2 };

			return viewOptions;
		},

		logResults: function () {
			var modelTransform = function (model) {
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
			};

			var results = {
				team1: this.groupModel.get("group1").map(modelTransform),
				team2: this.groupModel.get("group2").map(modelTransform)
			};
			return { results: results };
		},
	});

	return TeamPrisonersDilemmaStates;
});