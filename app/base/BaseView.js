define(["backbone.layoutmanager"],

function() {

  var BaseView = Backbone.View.extend({

    afterRender: function () {
      if (this.initialRender) {
        this.initialRender = false;
      }
    },

    initialize: function (options) {
      // move the option participants directly to the view
      if (options && options.participants) {
        this.participants = options.participants;
      }

      this.initialRender = true;
    }
  });

  return BaseView;
});