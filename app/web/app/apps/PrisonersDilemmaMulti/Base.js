define([
	"framework/App",
	"framework/modules/common/Common",
],
function (App, Common) {

	var PrisonersDilemmaMulti = {};
	PrisonersDilemmaMulti.config = {
		scoringMatrix: {
			CC: 3,
			CD: 0,
			DC: 5,
			DD: 1
		},
		minRounds: 3,
		maxRounds: 6,
	};

	return PrisonersDilemmaMulti;
});