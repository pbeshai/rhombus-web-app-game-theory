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

	CoinMatchingViews.Play.Participant = Common.Views.ParticipantHiddenPlay;

	CoinMatchingViews.Play.Layout = App.registerView("coin-matching::play", Common.Mixins.mixin(["rounds", "phaseTotals"], Common.Views.GroupLayout.extend({
		header: "Play",
		ParticipantView: CoinMatchingViews.Play.Participant,
		InstructionsModel: CoinMatching.Instructions,
	})));

	CoinMatchingViews.Results = {};

	CoinMatchingViews.Results.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreChoiceDisplay.extend({
		labelChoice: CoinMatching.Util.labelChoice
	}));

	CoinMatchingViews.Results.Layout = App.registerView("coin-matching::results", Common.Mixins.mixin(["rounds", "phaseTotals"], Common.Views.GroupLayout.extend({
		header: "Results",
		className: "coin-matching-results",
		ParticipantView: CoinMatchingViews.Results.Score,
	})));


	CoinMatchingViews.PhaseResults = {};

	CoinMatchingViews.PhaseResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreDisplay.extend({
		scoreAttribute: "phaseTotal"
	}));

	CoinMatchingViews.PhaseResults.Layout = App.registerView("coin-matching::phase-results", Common.Mixins.phaseTotals(Common.Views.GroupLayout.extend({
		header: "Results for Phase ",
		className: "coin-matching-results",
		ParticipantView: CoinMatchingViews.PhaseResults.Score,
	})));


	CoinMatchingViews.TotalResults = {};

	CoinMatchingViews.TotalResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreDisplay.extend({
		scoreAttribute: "total"
	}));

	CoinMatchingViews.TotalResults.Layout = App.registerView("coin-matching::total-results", Common.Mixins.totals(Common.Views.GroupLayout.extend({
		header: "Total Results",
		className: "coin-matching-results",
		ParticipantView: CoinMatchingViews.TotalResults.Score,
	})));

	return CoinMatchingViews;
});