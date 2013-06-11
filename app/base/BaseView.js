/**

A simple module for showing active participants and allowing registration of new ones.

*/
define(["backbone.layoutmanager"],

function() {

  var BaseView = Backbone.View.extend({
    initialRender: true,
    // rendering: {
    //   fadeIn: boolean,
    //   initialBefore: func,
    //   initialAfter: func,
    //   before: func,  // before render callback
    //   after: func    // after render callback
    // },

    beforeRender: function () {
      if (this.rendering) {
        if (this.initialRender) {
          if (this.rendering.initialBefore) {
            this.rendering.initialBefore.call(this)
          }

          if (this.rendering.fadeIn) {
            this.$el.hide();
          }
        }

        if (this.rendering.before) {
          this.rendering.before.call(this);
        }
      }
    },

    afterRender: function () {
      if (this.rendering) {
        if (this.initialRender) {
          if (this.rendering.initialAfter) {
            this.rendering.initialAfter.call(this);
          }

          if (this.rendering.fadeIn) {
            this.$el.fadeIn(200);
          }

          this.initialRender = false;
        }

        if (this.rendering.after) {
          this.rendering.after.call(this);
        }
      }
    }
  });

  return BaseView;
});