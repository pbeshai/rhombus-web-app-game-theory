define([
	"framework/App",
	"framework/modules/common/Common",
],
function (App, Common) {

	var TeamPrisonersDilemma = {};
	TeamPrisonersDilemma.config = {
		group1Name: "Team 1",
		group2Name: "Team 2",
		scoringMatrix: {
			CC: 3,
			CD: 0,
			DC: 5,
			DD: 1
		}
	};

	TeamPrisonersDilemma.TeamsModel = Common.Models.GroupModel;

	return TeamPrisonersDilemma;
});