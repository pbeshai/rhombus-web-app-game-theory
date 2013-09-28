define([
	"framework/App",
	"framework/modules/common/Common"
],
function (App, Common) {
	var Question = {};

	Question.config = {
		questions: [
			{
				question: "Initializing...",
				answers: {
					"A": "Strongly Agree",
					"B": "Agree",
					"C": "Neutral",
					"D": "Disagree",
					"E": "Strongly Disagree"
				}
			}
		]
	};

	Question.Instructions = Common.Models.Instructions.extend({
		header: "Answers",
		configInit: function (config) {
			this.attributes.buttonConfig = {
				"A": config.answers.A == null ? null : { description: config.answers.A },
				"B": config.answers.B == null ? null : { description: config.answers.B },
				"C": config.answers.C == null ? null : { description: config.answers.C },
				"D": config.answers.D == null ? null : { description: config.answers.D },
				"E": config.answers.E == null ? null : { description: config.answers.E },
			};
		}
	});

  return Question;
});