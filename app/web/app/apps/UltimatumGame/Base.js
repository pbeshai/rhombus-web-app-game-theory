define([
	"framework/App",
	"framework/modules/common/Common"
],
function (App, Common) {

	var UltimatumGame = {};

	UltimatumGame.config = function () {
		return {
			amount: 10,
			roundsPerPhase: 2,
			offerMap: { // map of choices givers make to amounts offered
				"A": 5,
				"B": 1,
			}
		};
	}

	UltimatumGame.Instructions = {};
	UltimatumGame.Instructions.GiverPlay = Common.Models.Instructions.extend({
		header: "Giver Instructions",
		configInit: function (config) {
			var buttonConfig = {};

			_.each(_.keys(config.offerMap), function (key) {
				buttonConfig[key] = { description: "Demand " + (config.amount - config.offerMap[key]) + " / Offer " + config.offerMap[key] };
			});
			this.attributes.buttonConfig = buttonConfig;
			this.attributes.description = "Total Amount: " + config.amount;
		}
	});
	UltimatumGame.Instructions.ReceiverPlay = Common.Models.Instructions.extend({
		header: "Receiver Instructions",
		buttonConfig: {
			A: { description: "Accept offer" },
			B: { description: "Reject offer" },
		},

		configInit: function (config) {
			this.attributes.description = "Total Amount: " + config.amount;
		}
	});

	UltimatumGame.Util = {};
	UltimatumGame.Util.assignOffers = function (givers, amount, offerMap) {
		givers.each(function (giver) {
			var offer = offerMap[giver.get("choice")];
			var keep = amount - offer;
			giver.set("keep", keep); // amount kept
			giver.get("partner").set("offer", offerMap[giver.get("choice")]); // amount given away
		}, this);
	};

	return UltimatumGame;
});