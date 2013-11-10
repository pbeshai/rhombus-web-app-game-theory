define([
	"framework/App",
	"framework/modules/common/Common",

	"apps/UltimatumGame/Base"
],
function (App, Common, UltimatumGame) {

	var UltimatumGameViews = {};


	UltimatumGameViews.Configure = Common.Views.ModelConfigure.Layout.extend({
		modelOptions: _.extend({}, UltimatumGame.config)
	});

	UltimatumGameViews.AppControls = Common.Views.AppControls.extend({
		AppConfigView: UltimatumGameViews.Configure
	});

	UltimatumGameViews.GiverPlay = {};

	UltimatumGameViews.GiverPlay.Giver = Common.Views.ParticipantHiddenPlay;

	UltimatumGameViews.GiverPlay.Layout = App.registerView("ug::giver-play", Common.Mixins.rounds(Common.Views.SimpleLayout.extend({
		header: "Givers Play",
		ParticipantView: UltimatumGameViews.GiverPlay.Giver,
		InstructionsModel: UltimatumGame.Instructions.GiverPlay
	})));

	UltimatumGameViews.ReceiverPlay = {};

	UltimatumGameViews.ReceiverPlay.Legend = Common.Views.Legend.extend({
		items: {
			"blue": "Offer 5",
			"orange": "Offer 1"
		}
	});

	UltimatumGameViews.ReceiverPlay.PercentageBar = Common.Views.PercentageBar.extend({
    labels: {
      "o5" : { label: "Offer 5", key: "choice-a" },
      "o1" : { label: "Offer 1", key: "choice-b" },
    },
    percentageSections: function () {
      var sections = [];

      var total = this.participants.length;

      var counts = _.countBy(this.participants.pluck("offer"), function (offer) {
        return "o"+offer;
      });

      var labels = this.labels;
      addSection("o5");
      addSection("o1");

      function addSection(offer) {
        if (counts[offer]) {
          var section = _.extend({ percentage: (100 * counts[offer] / total) }, labels[offer]);
          sections.push(section);
        }
      }

      return sections;
    }
  });

	UltimatumGameViews.ReceiverPlay.Receiver = Common.Views.ParticipantMessagePlay.extend({
		messageAttribute: "offer"
	});

	UltimatumGameViews.ReceiverPlay.Layout = App.registerView("ug::receiver-play", Common.Mixins.rounds(Common.Views.SimpleLayout.extend({
		header: "Receivers Play",
		PreHeaderView: UltimatumGameViews.ReceiverPlay.Legend,
		PreParticipantsView: UltimatumGameViews.ReceiverPlay.PercentageBar,
		ParticipantView: UltimatumGameViews.ReceiverPlay.Receiver,
		InstructionsModel: UltimatumGame.Instructions.ReceiverPlay
	})));

	UltimatumGameViews.Results = {};

	UltimatumGameViews.Results.Legend = Common.Views.Legend.extend({
		items: {
			"green": "Accepted",
			"red": "Rejected"
		}
	});

	UltimatumGameViews.Results.PercentageBar = Common.Views.PercentageBar.extend({
    labels: {
      "accepted" : { label: "Accepted", key: "green" },
      "rejected" : { label: "Rejected", key: "red" },
    },
    scoreAttribute: "giverScore",

    percentageSections: function () {
      var sections = [];

      var total = this.participants.length;

      var counts = _.countBy(this.participants.models, function (model, i) {
        if (model.get("keep") === model.get(this.scoreAttribute)) {
          return "accepted";
        }
        return "rejected";
      }, this);

      var labels = this.labels;
      addSection("accepted");
      addSection("rejected");

      function addSection(offer) {
        if (counts[offer]) {
          var section = _.extend({ percentage: (100 * counts[offer] / total) }, labels[offer]);
          sections.push(section);
        }
      }

      return sections;
    }
  });

	UltimatumGameViews.Results.Participant = Common.Views.ParticipantScoreChoiceDisplay.extend({
		overlay: function (model) {
			return "no-animate";
		}
	});

	UltimatumGameViews.Results.BucketParticipant = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreChoiceDisplay.extend({
		totalAttribute: "phaseTotal",
		mainText: function (model) {
			return this.getScore(model);
		}
	}));

	UltimatumGameViews.Results.GiverParticipant = UltimatumGameViews.Results.BucketParticipant.extend({
		scoreAttribute: "giverScore",
		totalAttribute: null,

		overlay: function (model) {
			var overlay = UltimatumGameViews.Results.BucketParticipant.prototype.overlay.apply(this, arguments);
			var offer = model.get("keep"), score = this.getScore(model);
			if (offer === score) {
				overlay += " bucket-green";
			} else {
				overlay += " bucket-red";
			}
			return overlay;
		},

		mainText: function (model) {
			var offer = model.get("keep"), score = this.getScore(model);
			if (offer === score) {
				return score;
			}
			return offer + " &rarr; " + score;
		}
	});

	UltimatumGameViews.Results.ReceiverParticipant = UltimatumGameViews.Results.BucketParticipant.extend({
		scoreAttribute: "receiverScore",
		totalAttribute: null,

		overlay: function (model) {
			var overlay = UltimatumGameViews.Results.BucketParticipant.prototype.overlay.apply(this, arguments);
			var offer = model.get("offer"), score = this.getScore(model);
			if (offer === score) {
				overlay += " bucket-green";
			} else {
				overlay += " bucket-red";
			}
			return overlay;
		},

		mainText: function (model) {
			var offer = model.get("offer"), score = this.getScore(model);
			if (offer === score) {
				return score;
			}
			return offer + " &rarr; " + score;
		}
	});

	UltimatumGameViews.Results.GiverLayout = App.registerView("ug::giver-results", Common.Mixins.rounds(Common.Views.SimpleLayout.extend({
		header: "Giver Results",
		className: "ultimatum-results",
		PreHeaderView: UltimatumGameViews.Results.Legend,
		PreParticipantsView: UltimatumGameViews.Results.PercentageBar,
		ParticipantView: UltimatumGameViews.Results.GiverParticipant
	})));


	UltimatumGameViews.Results.ReceiverLayout = App.registerView("ug::receiver-results", Common.Mixins.rounds(Common.Views.SimpleLayout.extend({
		header: "Receiver Results",
		className: "ultimatum-results",
		PreHeaderView: UltimatumGameViews.Results.Legend,
		PreParticipantsView: UltimatumGameViews.Results.PercentageBar,
		ParticipantView: UltimatumGameViews.Results.ReceiverParticipant
	})));


	UltimatumGameViews.Results.ScoreLayout = App.registerView("ug::score-results", Common.Mixins.rounds(Common.Views.SimpleLayout.extend({
		header: "Combined Results",
		className: "ultimatum-results",
		PreHeaderView: UltimatumGameViews.Results.Legend,
		PreParticipantsView: UltimatumGameViews.Results.PercentageBar,
		ParticipantView: UltimatumGameViews.Results.BucketParticipant
	})));


	UltimatumGameViews.PhaseResults = {};

	UltimatumGameViews.PhaseResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreDisplay.extend({
		scoreAttribute: "phaseTotal"
	}));

	UltimatumGameViews.PhaseResults.Layout = App.registerView("ug::phase-results", Common.Views.SimpleLayout.extend({
		header: "Phase Total Results",
		className: "ug-results",
		ParticipantView: UltimatumGameViews.PhaseResults.Score,
	}));


	UltimatumGameViews.TotalResults = {};

	UltimatumGameViews.TotalResults.Score = Common.Mixins.bucketParticipant(Common.Views.ParticipantScoreDisplay.extend({
		scoreAttribute: "total"
	}));

	UltimatumGameViews.TotalResults.Layout = App.registerView("ug::total-results", Common.Views.SimpleLayout.extend({
		header: "Total Results",
		className: "ug-results",
		ParticipantView: UltimatumGameViews.TotalResults.Score,
	}));


	return UltimatumGameViews;
});