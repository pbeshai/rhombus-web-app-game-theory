define([
	"framework/App",
	"framework/modules/common/Common",

	"apps/UltimatumGame/Module",
	"apps/UltimatumGamePartitioned/Base"
],
function (App, Common, UltimatumGame, UltimatumGamePartitioned) {

	var UltimatumGamePartitionedViews = {};

	UltimatumGamePartitionedViews.Configure = Common.Views.ModelConfigure.Layout.extend({
		modelOptions: _.extend({}, UltimatumGamePartitioned.config)
	});

	UltimatumGamePartitionedViews.AppControls = Common.Views.AppControls.extend({
		AppConfigView: UltimatumGamePartitionedViews.Configure
	});

	UltimatumGamePartitionedViews.GiverPlay = {};

	UltimatumGamePartitionedViews.GiverPlay.Giver = Common.Views.ParticipantHiddenPlay;
	UltimatumGamePartitionedViews.GiverPlay.Receiver = Common.Views.ParticipantHiddenPlay;

	UltimatumGamePartitionedViews.PreGroups = Backbone.View.extend({
		template: "app/apps/UltimatumGame/templates/pre_participants",
		serialize: function () {
			return { total: this.options.config.amount };
		},
	});

	UltimatumGamePartitionedViews.GiverPlay.Layout = App.registerView("ugp::giver-play", Common.Views.GroupLayout.extend({
		header: "Givers Play",
		inactive: {
			group2: true
		},
		PreGroupsView: UltimatumGamePartitionedViews.PreGroups,
		ParticipantView: {
			group1: UltimatumGamePartitionedViews.GiverPlay.Giver,
			group2: UltimatumGamePartitionedViews.GiverPlay.Receiver
		},
		InstructionsModel: UltimatumGame.Instructions.GiverPlay
	}));

	UltimatumGamePartitionedViews.ReceiverPlay = {};

	UltimatumGamePartitionedViews.ReceiverPlay.Giver = Common.Views.ParticipantHiddenPlay.extend({
		// locked: true
	});

	UltimatumGamePartitionedViews.ReceiverPlay.Receiver = Common.Views.ParticipantMessagePlay.extend({
		messageAttribute: "offer"
	});

	UltimatumGamePartitionedViews.ReceiverPlay.Layout = App.registerView("ugp::receiver-play", Common.Views.GroupLayout.extend({
		header: "Receivers Play",
		inactive: {
			group1: true
		},
		PreGroupsView: UltimatumGamePartitionedViews.PreGroups,
		ParticipantView: {
			group1: UltimatumGamePartitionedViews.ReceiverPlay.Giver,
			group2: UltimatumGamePartitionedViews.ReceiverPlay.Receiver
		},
		InstructionsModel: UltimatumGame.Instructions.ReceiverPlay
	}));

	UltimatumGamePartitionedViews.Results = {};


	UltimatumGamePartitionedViews.Results.Score = Common.Views.ParticipantDisplay.extend({
		cssClass: function (model) {
			if (model.get("score") === 0) {
				return "rejected";
			} else {
				return "accepted";
			}
		},
		bottomText: function (model) {
			if (model.get("score") === 0) {
				return "Rejected";
			} else {
				return "Accepted";
			}
		},
		mainText: function (model) {
			if (model.get("score") !== 0) {
				return model.get("score");
			}
			// show the original offer if rejected
			if (model.get("offer")) {
				return model.get("offer") + " &rarr; " + model.get("score");
			}
			return model.get("keep") + " &rarr; " + model.get("score");
		}
	});

	UltimatumGamePartitionedViews.Results.Layout = App.registerView("ugp::results", Common.Views.GroupLayout.extend({
		header: "Results",
		PreGroupsView: UltimatumGamePartitionedViews.PreGroups,
		ParticipantView: UltimatumGamePartitionedViews.Results.Score
	}));

	return UltimatumGamePartitionedViews;
});