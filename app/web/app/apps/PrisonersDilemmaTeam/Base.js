define([
	"framework/App",
	"framework/modules/common/Common",
	"apps/PrisonersDilemma/Module",
],
function (App, Common, PrisonersDilemma) {

	var PrisonersDilemmaTeam = {};
	PrisonersDilemmaTeam.config = {
		scoringMatrix: {
			CC: 2,
			CD: 0,
			DC: 3,
			DD: 1
		},
		roundsPerPhase: 5,
		group1Name: "Team 1",
		group2Name: "Team 2",
	};

	PrisonersDilemmaTeam.Instructions = PrisonersDilemma.Instructions

	PrisonersDilemmaTeam.Util = PrisonersDilemma.Util;


	return PrisonersDilemmaTeam;
});