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

	StagHuntViews.Play.Participant = Common.Views.ParticipantHiddenPlay.extend({
		bottomText: function (model) {
			if (model.get("score") != null) {
				return "Prev. " + model.get("score");
			}
		}
	});

	var total = Common.Util.Totals.total;


	StagHuntViews.Play.Layout = App.registerView("stag-hunt::play", Common.Mixins.rounds(Common.Views.GroupLayout.extend({
		header: "Play",
		ParticipantView: StagHuntViews.Play.Participant,
		InstructionsModel: StagHunt.Instructions,
		group1HeaderRight: function () { return total(this.model.get("group1"), "phaseTotal"); },
		group2HeaderRight: function () { return total(this.model.get("group2"), "phaseTotal"); }
	})));

	StagHuntViews.Results = {};

	StagHuntViews.Results.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantDisplay.extend({
		locked: true,

		overlay: function (model) {
			var overlay = "no-animate";

			if (model.get("choice") === "A") {
				overlay += " bucket-green";
			} else if (model.get("choice") === "B") {
				overlay += " bucket-purple";
			} else {
				overlay += " bucket-0"; // rare case where they didn't play anything and didn't get default choice
			}

			return overlay;
		},

		mainText: function (model) {
			var choice = StagHunt.Util.labelChoice(model.get("choice")),
					partnerChoice = StagHunt.Util.labelChoice(model.get("partner").get("choice"));

			var outcome = choice + partnerChoice;
			if (model.get("score") != null) {
				outcome += " " + model.get("score");
			}

			return outcome;
		},
		bottomText: function (model) {
			if (model.get("phaseTotal") != null) {
				return "Total " + model.get("phaseTotal");
			}
		}
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

	StagHuntViews.Results.Layout = App.registerView("stag-hunt::results", Common.Mixins.rounds(Common.Views.GroupLayout.extend({
		header: "Results",
		className: "stag-hunt-results",
		PreHeaderView: StagHuntViews.Results.Legend,
		ParticipantView: StagHuntViews.Results.Score,
		PreParticipantsView: StagHuntViews.Results.PercentageBar,
		group1HeaderRight: function () { return total(this.model.get("group1"), "phaseTotal"); },
		group2HeaderRight: function () { return total(this.model.get("group2"), "phaseTotal"); },
	})));


	StagHuntViews.PhaseResults = {};

	StagHuntViews.PhaseResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantDisplay.extend({
		locked: true,
		overlay: function (model) {
			var overlay = "no-animate";
			if (model.get("phaseTotal") === model.get("bucketMax")) {
				overlay += " max-score";
			}

			return overlay;
		},

		mainText: function (model) {
			return model.get("phaseTotal");
		},
	}));

	StagHuntViews.PhaseResults.Layout = App.registerView("stag-hunt::phase-results", Common.Views.GroupLayout.extend({
		header: "Phase Total Results",
		className: "stag-hunt-results",
		ParticipantView: StagHuntViews.PhaseResults.Score,
		group1HeaderRight: function () { return total(this.model.get("group1"), "phaseTotal"); },
		group2HeaderRight: function () { return total(this.model.get("group2"), "phaseTotal"); }
	}));


	StagHuntViews.TotalResults = {};

	StagHuntViews.TotalResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantDisplay.extend({
		locked: true,
		overlay: function (model) {
			var overlay = "no-animate";
			if (model.get("total") === model.get("bucketMax")) {
				overlay += " max-score";
			}

			return overlay;
		},

		mainText: function (model) {
			return model.get("total");
		},
	}));

	StagHuntViews.TotalResults.Layout = App.registerView("stag-hunt::total-results", Common.Views.GroupLayout.extend({
		header: "Total Results",
		className: "stag-hunt-results",
		ParticipantView: StagHuntViews.TotalResults.Score,
		group1HeaderRight: function () { return total(this.model.get("group1"), "total"); },
		group2HeaderRight: function () { return total(this.model.get("group2"), "total"); }
	}));

	return StagHuntViews;
});