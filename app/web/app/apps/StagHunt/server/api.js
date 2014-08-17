module.exports = {
	init: init
};

var fs = require('fs'),
	_ = require('lodash'),
	logger = require("../../../../../../log/logger"),
	util = require("../../../../../../framework/server/api/util");

function init(site, initConfig) {
	site.post("/api/apps/stag-hunt/log", stagHuntResults);
}


function stagHuntResults(req, res) {
	var numPhases = 3;
	var choiceMap = {
		A: "S",
		B: "H",
	};

	util.teamPhaseMatrixResults(req, res, "stag-hunt", "Stag Hunt", numPhases, choiceMap);
}
