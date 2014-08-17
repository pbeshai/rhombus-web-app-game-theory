module.exports = {
	init: init
};

var fs = require('fs'),
	_ = require('lodash'),
	logger = require("../../../../../../log/logger"),
	util = require("../../../../../../framework/server/api/util");

function init(site, initConfig) {
	site.post("/api/apps/coordination/log", coordinationResults);
}

function coordinationResults(req, res) {
	var numPhases = 3;
	var choiceMap = {
		A: "A",
		B: "B",
	};

	util.teamPhaseMatrixResults(req, res, "coordination", "Coordination", numPhases, choiceMap);
}
