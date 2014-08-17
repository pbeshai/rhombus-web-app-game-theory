module.exports = {
	init: init
};

var fs = require('fs'),
	_ = require('lodash'),
	logger = require("../../../../../../log/logger"),
	util = require("../../../../../../framework/server/api/util");

function init(site, initConfig) {
	site.post("/api/apps/coin-matching/log", coinMatchingResults);
}


function coinMatchingResults(req, res) {
	var numPhases = 3;
	var choiceMap = {
		A: "H",
		B: "T",
	};

	util.teamPhaseMatrixResults(req, res, "coin-matching", "Coin Matching", numPhases, choiceMap);
}
