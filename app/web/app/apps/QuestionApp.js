/**

N-Person Prisoner's Dilemma:

Attendance -> N-Person Prisoner's Dilemma Play -> N-Person Prisoner's Dilemam Results

*/
define([
	// Application.
	"framework/App",

	"framework/apps/StateApp",

	"framework/modules/common/CommonStateApps",
	"modules/Question"
],

function (App, StateApp, CommonStateApps, Question) {

	var QuestionApp = CommonStateApps.BasicApp.extend({
		id: "question",
		version: "1.0",
		config: Question.config,
		States: [ Question.States.Ask, Question.States.Ask ],

		initStateOptions: function () {
			_.each(this.config.questions, function (question, i) {
				this.stateOptions[i] = _.clone(question);
				if (this.options.numberQuestions) {
					this.stateOptions[i].question = (i + 1) + ". " + this.stateOptions[i].question;
				}
			}, this);
		}
	});

	// description for use in router
	QuestionApp.app = {
		instantiate: function (attrs) {
			return new QuestionApp(attrs, { writeLogAtEnd: false, numberQuestions: true });
		},
		AppControlsView: Question.Views.AppControls,
		title: "Question"
	};

	return QuestionApp;
});