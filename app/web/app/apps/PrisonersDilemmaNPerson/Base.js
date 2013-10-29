define([
	"framework/App",
	"framework/modules/common/Common",
],
function (App, Common) {

	var PrisonersDilemmaNPerson = {};
	PrisonersDilemmaNPerson.config = {
		// See Goehring and Kahan (1976) The Uniform N-Person Prisoner's Dilemma Game : Construction and Test of an Index of Cooperation
		Rratio: 0.10, // Rratio = R*(n-1). 0 < R < n-1, closer to 1 means more incentive for cooperation
		H: 10 // score increment when gaining 1 more cooperator
	};

	PrisonersDilemmaNPerson.Instructions = Common.Models.Instructions.extend({
		buttonConfig: {
			"C": { description: "Cooperate" },
			"D": { description: "Defect" },
		}
	});

	return PrisonersDilemmaNPerson;
});