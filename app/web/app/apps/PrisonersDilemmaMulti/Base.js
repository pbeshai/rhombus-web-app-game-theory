define([
	"framework/App",
	"framework/modules/common/Common",
],
function (App, Common) {

	var PrisonersDilemmaMulti = {};
	PrisonersDilemmaMulti.config = function () {
		return {
			scoringMatrix: {
				CC: 2,
				CD: 0,
				DC: 3,
				DD: 1
			},
			minRounds: 5,
			maxRounds: 5,
		};
	};

	return PrisonersDilemmaMulti;
});