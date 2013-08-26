
define([
  // Application.
  "app",

  "apps/StateApp",

  "modules/common/CommonStateApps",
  "modules/SequenceAliaser"
],

function(app, StateApp, CommonStateApps, SequenceAliaser) {

	var SequenceAliaserApp = CommonStateApps.BasicApp.extend({
		id: "seq-alias",
		version: "1.0",
		config: SequenceAliaser.config,
		States: [ SequenceAliaser.State ],
		prepend: { },

		initStateOptions: function () {
			this.stateOptions[0] = { participants: this.get("participants") };
			this.get("participants").options.acceptNew = true;
		}
	})

	// description for use in router
	SequenceAliaserApp.app = {
		instantiate: function (attrs) {
			return new SequenceAliaserApp(attrs, { writeLogAtEnd: false });
		},
		configView: SequenceAliaser.Views.Configure,
		title: "Sequence Aliaser"
	};

  return SequenceAliaserApp;
});