define([
	"framework/App",
	"framework/modules/common/Common",
	"framework/modules/StateApp/Module",

	"apps/UltimatumGame/Module",
	"apps/UltimatumGamePartitioned/Base",
	"apps/UltimatumGamePartitioned/Views"
],
function (App, Common, StateApp, UltimatumGame, UltimatumGamePartitioned) {

	var UltimatumGamePartitionedStates = {};

	UltimatumGamePartitionedStates.GiverPlay = Common.States.GroupPlay.extend({
		name: "giver-play",
		view: "ugp::giver-play",
		validChoices: { group2: [] }, // group1 can do anything, group2 nothing

		handleConfigure: function () {
			this.render();
		},
		// do not modify group2
		prepareOutputGroup2: function () { },

		onExit: function () {
			// assign offers
			var result = Common.States.GroupPlay.prototype.onExit.call(this);

			UltimatumGame.Util.assignOffers(this.groupModel.get("group1"),
				this.config.amount, this.config.offerMap);

			return result;
		}
	});

	UltimatumGamePartitionedStates.ReceiverPlay = Common.States.GroupPlay.extend({
		name: "receiver-play",
		view: "ugp::receiver-play",
		validChoices: { group1: [], group2: ["A", "B"] },

		handleConfigure: function () {
			UltimatumGame.Util.assignOffers(this.groupModel.get("group1"),
				this.config.amount, this.config.offerMap);
		},

		prepareParticipantGroup1: function (participant) {
			Common.States.GroupPlay.prototype.prepareParticipantGroup1.apply(this, arguments);
			participant.set("played", true);
		},

		// do not modify group 1
		prepareOutputGroup1: function () { },
	});

	UltimatumGamePartitionedStates.Score = Common.States.GroupScore.extend({
		assignScoresGroup1: function () { },

		// assign score by iterating over receivers with this function
		assignScoreGroup2: function (receiver) {
			var giver = receiver.get("partner");
			if (receiver.get("choice") === "A") {
				receiver.set("score", receiver.get("offer"));
				giver.set("score", giver.get("keep"));
			} else {
				receiver.set("score", 0);
				giver.set("score", 0);
			}
		},
	});


	UltimatumGamePartitionedStates.Results = Common.States.GroupResults.extend({
		view: "ugp::results",

		handleConfigure: function () {
			UltimatumGame.Util.assignOffers(this.groupModel.get("group1"),
				this.config.amount, this.config.offerMap);
		},

		logResults: function () {
			var results = {};
			results.givers = this.groupModel.get("group1").map(function (giver) {
				return {
					alias: giver.get("alias"),
					keep: giver.get("keep"),
					score: giver.get("score"),
					partner: giver.get("partner").get("alias")
				};
			});

			results.receivers = this.groupModel.get("group2").map(function (receiver) {
				return {
					alias: receiver.get("alias"),
					offer: receiver.get("offer"),
					score: receiver.get("score"),
					partner: receiver.get("partner").get("alias")
				};
			});

			return { results: results };
		},
	});

	return UltimatumGamePartitionedStates;
});