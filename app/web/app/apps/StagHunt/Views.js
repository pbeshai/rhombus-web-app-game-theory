define([
	"framework/App",
	"framework/modules/common/Common",

	"apps/StagHunt/Base"
],
function (App, Common, StagHunt) {

	var StagHuntViews = {};

	StagHuntViews.Configure = Common.Views.ModelConfigure.Layout.extend({
		modelOptions: _.extend({}, StagHunt.config)
	});

	StagHuntViews.AppControls = Common.Views.AppControls.extend({
		AppConfigView: StagHuntViews.Configure
	});

	StagHuntViews.Play = {};

	StagHuntViews.Play.Participant = Common.Views.ParticipantHiddenPlay;

	var total = Common.Util.Totals.total;


	StagHuntViews.Play.Layout = App.registerView("stag-hunt::play", Common.Mixins.mixin(["rounds", "phaseTotals"], Common.Views.GroupLayout.extend({
		header: "Play",
		ParticipantView: StagHuntViews.Play.Participant,
		InstructionsModel: StagHunt.Instructions,
	})));

	StagHuntViews.Results = {};

	StagHuntViews.Results.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreChoiceDisplay.extend({
		labelChoice: StagHunt.Util.labelChoice,
		bucketChoiceMap: {
			"A" : "bucket-green",
			"B" : "bucket-purple",
			"default" : "dark-dim"
		},
	}));

	StagHuntViews.Results.Legend = Backbone.View.extend({
		template: "app/apps/StagHunt/templates/results/legend"
	});


	StagHuntViews.Results.PercentageBar = Common.Views.ChoicePercentageBar.extend({
		choices: {
			"A": { label: "Stag", key: "stag" },
			"B": { label: "Hare", key: "hare" },
			"null" : { label: "#", key: "choice-null" }
		}
	});

	StagHuntViews.Results.Layout = App.registerView("stag-hunt::results", Common.Mixins.mixin(["rounds", "phaseTotals"], Common.Views.GroupLayout.extend({
		header: "Results",
		className: "stag-hunt-results",
		PreHeaderView: StagHuntViews.Results.Legend,
		ParticipantView: StagHuntViews.Results.Score,
		PreParticipantsView: StagHuntViews.Results.PercentageBar
	})));


	StagHuntViews.PhaseResults = {};

	StagHuntViews.PhaseResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreDisplay.extend({
		scoreAttribute: "phaseTotal"
	}));

	StagHuntViews.PhaseResults.Layout = App.registerView("stag-hunt::phase-results", Common.Mixins.phaseTotals(Common.Views.GroupLayout.extend({
		header: "Phase Total Results",
		className: "stag-hunt-results",
		ParticipantView: StagHuntViews.PhaseResults.Score,
	})));


	StagHuntViews.TotalResults = {};

	StagHuntViews.TotalResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreDisplay.extend({
		scoreAttribute: "total"
	}));

	StagHuntViews.TotalResults.Layout = App.registerView("stag-hunt::total-results", Common.Mixins.totals(Common.Views.GroupLayout.extend({
		header: "Total Results",
		className: "stag-hunt-results",
		ParticipantView: StagHuntViews.TotalResults.Score,
	})));

	return StagHuntViews;
});