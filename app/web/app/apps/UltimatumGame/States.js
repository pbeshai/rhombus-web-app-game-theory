define([
	"framework/App",
	"framework/modules/common/Common",
	"framework/apps/StateApp",

	"apps/UltimatumGame/Base",
	"apps/UltimatumGame/Views"
],
function (App, Common, StateApp, UltimatumGame) {

	var UltimatumGameStates = {};

	UltimatumGameStates.GiverPlay = Common.States.Play.extend({
		name: "giver-play",
		view: "ug::giver-play",
		handleConfigure: function () {
			this.render();
		},

		// outputs a participant collection
		onExit: function () {
			var result = Common.States.Play.prototype.onExit.call(this);

			UltimatumGame.Util.assignOffers(this.participants,
				this.config.amount, this.config.offerMap);

			return result;
		}
	});

	UltimatumGameStates.ReceiverPlay = Common.States.Play.extend({
		name: "receiver-play",
		view: "ug::receiver-play",
		validChoices: ["A", "B"],

		handleConfigure: function () {
			UltimatumGame.Util.assignOffers(this.participants,
				this.config.amount, this.config.offerMap);

			this.render();
		},
	});

	UltimatumGameStates.Score = Common.States.Score.extend({
		assignScore: function (participant) {
			var receiver = participant;
			var giver = receiver.get("partner");
			if (receiver.get("choice") === this.config.acceptChoice) {
				receiver.set("receiverScore", receiver.get("offer"));
				giver.set("giverScore", giver.get("keep"));
			} else {
				receiver.set("receiverScore", 0);
				giver.set("giverScore", 0);
			}
		}
	});

	UltimatumGameStates.Results = Common.States.Results.extend({
		view: "ug::results",

		handleConfigure: function () {
			UltimatumGame.Util.assignOffers(this.participants,
				this.config.amount, this.config.offerMap);
		},

		logResults: function () {
			var results = this.participants.map(function (model) {
				return {
					alias: model.get("alias"),
					giverOffer: model.get("keep"),
					giverScore: model.get("giverScore"),
					giverPartner: model.get("partner").get("alias"),
					receiverOffer: model.get("offer"),
					receiverScore: model.get("receiverScore"),
					receiverPartner: model.get("partnerBackward").get("alias")
				};
			});

			return { results: results };
		}
	});

	return UltimatumGameStates;
});