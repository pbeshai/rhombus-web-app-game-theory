define([
	"framework/App",
	"framework/modules/common/Common"
],
function (App, Common) {

	var UltimatumGamePartitioned = {};

	UltimatumGamePartitioned.config = {
		amount: 10,
		offerMap: { // map of choices givers make to amounts offered
			"A": 5,
			"B": 4,
			"C": 3,
			"D": 2,
			"E": 1
		},
		group1Name: "Givers",
		group2Name: "Receivers",
	};

	return UltimatumGamePartitioned;
});