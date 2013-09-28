/**

	Coin Matching for Peter Danielson's COGS 300 class

*/
define([
	// Application.
	"framework/App",
	"framework/modules/common/Common",

	"apps/CoinMatching/Base"
],
function (App, Common, CoinMatching) {

	var CoinMatchingViews = {};

	CoinMatchingViews.Configure = Common.Views.ModelConfigure.Layout.extend({
		modelOptions: _.extend({}, CoinMatching.config)
	});

	CoinMatchingViews.AppControls = Common.Views.AppControls.extend({
		AppConfigView: CoinMatchingViews.Configure
	});

	CoinMatchingViews.Play = {};

	CoinMatchingViews.Play.Participant = Common.Views.ParticipantHiddenPlay.extend({
		bottomText: function (model) {
			if (model.get("score") != null) {
				return "Prev. " + model.get("score");
			}
		}
	});

	function total(collection, attribute) {
		return collection.reduce(function (memo, p) {
			return memo + (p.get(attribute) || 0);
		}, 0);
	}

	CoinMatchingViews.Play.Layout = App.registerView("coin-matching::play", Common.Mixins.rounds(Common.Views.GroupLayout.extend({
		header: "Play",
		ParticipantView: CoinMatchingViews.Play.Participant,
		InstructionsModel: CoinMatching.Instructions,
		group1HeaderRight: function () { return total(this.model.get("group1"), "phaseTotal"); },
		group2HeaderRight: function () { return total(this.model.get("group2"), "phaseTotal"); }
	})));

	CoinMatchingViews.Results = {};

	CoinMatchingViews.Results.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantDisplay.extend({
		locked: true,

		overlay: function (model) {
			return "no-animate";
		},

		mainText: function (model) {
			var choice = CoinMatching.Util.labelChoice(model.get("choice")),
					partnerChoice = CoinMatching.Util.labelChoice(model.get("partner").get("choice"));

			var outcome;
			if (model.get("role") === "row") {
				outcome = choice+partnerChoice;
			} else {
				outcome = partnerChoice+choice;
			}
			return outcome + " "+model.get("score");
		},
		bottomText: function (model) {
			if (model.get("phaseTotal") != null) {
				return "Total " + model.get("phaseTotal");
			}
		}
	}));

	CoinMatchingViews.Results.Layout = App.registerView("coin-matching::results", Common.Mixins.rounds(Common.Views.GroupLayout.extend({
		header: "Results",
		className: "coin-matching-results",
		ParticipantView: CoinMatchingViews.Results.Score,
		group1HeaderRight: function () { return total(this.model.get("group1"), "phaseTotal"); },
		group2HeaderRight: function () { return total(this.model.get("group2"), "phaseTotal"); },
	})));


	CoinMatchingViews.PhaseResults = {};

	CoinMatchingViews.PhaseResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantDisplay.extend({
		locked: true,
		overlay: function (model) {
			return "no-animate";
		},

		mainText: function (model) {
			return model.get("phaseTotal");
		},
	}));

	CoinMatchingViews.PhaseResults.Layout = App.registerView("coin-matching::phase-results", Common.Views.GroupLayout.extend({
		header: "Results for Phase ",
		className: "coin-matching-results",
		ParticipantView: CoinMatchingViews.PhaseResults.Score,
		group1HeaderRight: function () { return total(this.model.get("group1"), "phaseTotal"); },
		group2HeaderRight: function () { return total(this.model.get("group2"), "phaseTotal"); }
	}));


	CoinMatchingViews.TotalResults = {};

	CoinMatchingViews.TotalResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantDisplay.extend({
		locked: true,
		overlay: function (model) {
			return "no-animate";
		},

		mainText: function (model) {
			return model.get("total");
		},
	}));

	CoinMatchingViews.TotalResults.Layout = App.registerView("coin-matching::total-results", Common.Views.GroupLayout.extend({
		header: "Total Results",
		className: "coin-matching-results",
		ParticipantView: CoinMatchingViews.TotalResults.Score,
		group1HeaderRight: function () { return total(this.model.get("group1"), "total"); },
		group2HeaderRight: function () { return total(this.model.get("group2"), "total"); }
	}));

	return CoinMatchingViews;
});