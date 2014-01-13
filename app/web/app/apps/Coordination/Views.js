/**

	Coordination for Peter Danielson's COGS 300 class

*/
define([
	// Application.
	"framework/App",
	"framework/modules/common/Common",

	"apps/Coordination/Base"
],
function (App, Common, Coordination) {

	var CoordinationViews = {};

	CoordinationViews.Configure = Common.Views.ModelConfigure.Layout.extend({
		modelOptions: function () { return Coordination.config(); }
	});

	CoordinationViews.AppControls = Common.Views.AppControls.extend({
		AppConfigView: CoordinationViews.Configure
	});

	CoordinationViews.Play = {};

	CoordinationViews.Play.Participant = Common.Views.ParticipantHiddenPlay;

	CoordinationViews.Play.Layout = App.registerView("coordination::play", Common.Mixins.mixin(["rounds", "phaseTotals"], Common.Views.GroupLayout.extend({
		header: "Play",
		ParticipantView: CoordinationViews.Play.Participant,
		InstructionsModel: Coordination.Instructions,
	})));

	CoordinationViews.Results = {};

	CoordinationViews.Results.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreChoiceDisplay.extend({
		labelChoice: Coordination.Util.labelChoice
	}));

	CoordinationViews.Results.Layout = App.registerView("coordination::results", Common.Mixins.mixin(["rounds", "phaseTotals"], Common.Views.GroupLayout.extend({
		header: "Results",
		className: "coordination-results",
		ParticipantView: CoordinationViews.Results.Score,
	})));


	CoordinationViews.PhaseResults = {};

	CoordinationViews.PhaseResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreDisplay.extend({
		scoreAttribute: "phaseTotal"
	}));

	CoordinationViews.PhaseResults.Layout = App.registerView("coordination::phase-results", Common.Mixins.phaseTotals(Common.Views.GroupLayout.extend({
		header: "Results for Phase ",
		className: "coordination-results",
		ParticipantView: CoordinationViews.PhaseResults.Score,
	})));


	CoordinationViews.TotalResults = {};

	CoordinationViews.TotalResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreDisplay.extend({
		scoreAttribute: "total"
	}));

	CoordinationViews.TotalResults.Layout = App.registerView("coordination::total-results", Common.Mixins.totals(Common.Views.GroupLayout.extend({
		header: "Total Results",
		className: "coordination-results",
		ParticipantView: CoordinationViews.TotalResults.Score,
	})));

	return CoordinationViews;
});