define([
  "app",
  "modules/common/CommonModels",
  "modules/common/CommonViews",
  "modules/common/CommonMixins",
  "modules/common/CommonStates",
],

function (app, CommonModels, CommonViews, CommonMixins, CommonStates) {
  var Common = {
    Models: CommonModels,
    Views: CommonViews,
    Mixins: CommonMixins,
    States: CommonStates
  };

  return Common;
});