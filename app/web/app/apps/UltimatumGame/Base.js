define([
	"framework/App",
	"framework/modules/common/Common"
],
function (App, Common) {

	var UltimatumGame = {};

	UltimatumGame.config = {
		amount: 10,
		offerMap: { // map of choices givers make to amounts offered
			"A": 5,
			"B": 4,
			"C": 3,
			"D": 2,
			"E": 1
		},
	};

	UltimatumGame.Instructions = {};
	UltimatumGame.Instructions.GiverPlay = Common.Models.Instructions.extend({
		header: "Giver Instructions",
		configInit: function (config) {
			this.attributes.buttonConfig = {
				"A": { description: "Offer " + config.offerMap.A },
				"B": { description: "Offer " + config.offerMap.B },
				"C": { description: "Offer " + config.offerMap.C },
				"D": { description: "Offer " + config.offerMap.D },
				"E": { description: "Offer " + config.offerMap.E },
			};
		}
	});
	UltimatumGame.Instructions.ReceiverPlay = Common.Models.Instructions.extend({
		header: "Receiver Instructions",
		buttonConfig: {
			A: { description: "Accept offer" },
			B: { description: "Reject offer" },
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