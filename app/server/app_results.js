module.exports = {
	initialize: initialize
};

var fs = require('fs'),
	_ = require('lodash'),
	logger = require("../../log/logger");

function initialize(site) {
	site.post("/api/apps/pd/log", pdResults);
	site.post("/api/apps/pdm/log", pdmResults);
	site.post("/api/apps/npd/log", npdResults);
	site.post("/api/apps/pdteam/log", pdteamResults);
	site.post("/api/apps/ultimatum/log", ultimatumResults);
	site.post("/api/apps/ultimatum-partition/log", ultimatumPartitionedResults);
	site.post("/api/apps/coin-matching/log", coinMatchingResults);
	site.post("/api/apps/stag-hunt/log", stagHuntResults);
	site.post("/api/apps/q/log", questionResults);
}


function z(str) { // add leading zero
	return ("0"+str).slice(-2);
}

function filenameFormat(date) {
	return date.getFullYear()+z(date.getMonth()+1)+z(date.getDate())+"_"+z(date.getHours())+z(date.getMinutes())+z(date.getSeconds());
}


function pdResults(req, res) {
	var now = new Date();
	var results = req.body.results;
	var config = req.body.config;
	var version = req.body.version;

	var stream = fs.createWriteStream("log/pd/results." + filenameFormat(now) + ".txt");

	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output("Prisoner's Dilemma Results (v" + version + ")");
		output(now.toString());
		if (config.message) {
			output(config.message);
		}
		if (config.scoringMatrix) {
			output("CC," + config.scoringMatrix.CC + ",CD," + config.scoringMatrix.CD);
			output("DC," + config.scoringMatrix.DC + ",DD," + config.scoringMatrix.DD);
		}

		output("Alias,Choice,Payoff,PartnerAlias,PartnerChoice,PartnerPayoff");
		_.each(results, function (result) {
			output(result.alias + "," + result.choice + "," + result.score + "," + result.partner.alias + "," + result.partner.choice + "," + result.partner.score);
		});
		stream.end();
	});
	res.send(200);
}

function pdmResults(req, res) {
	var now = new Date();
	var config = req.body.config;
	var version = req.body.version;
	var round = req.body.round;

	var stream = fs.createWriteStream("log/pdm/results." + filenameFormat(now) + ".txt");
	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output("Multiround Prisoner's Dilemma Results (v" + version + ")");
		output(now.toString());

		if (config.message) {
			output(config.message);
		}
		if (config.scoringMatrix) {
			output("CC," + config.scoringMatrix.CC + ",CD," + config.scoringMatrix.CD);
			output("DC," + config.scoringMatrix.DC + ",DD," + config.scoringMatrix.DD);
		}

		output(config.numRounds + " rounds (range was " + config.minRounds + "-" + config.maxRounds +")");
		var r, header = "Alias,PartnerAlias";
		for (r = 1; r <= config.numRounds; r++) {
			header += ",Round" + r + "Choice,Round" + r + "Payoff";
		}
		output(header);

		// for each participant, output choices and scores from each round
		_.each(req.body.round1, function (participant, i) {
			var roundData, data = participant.alias + "," + participant.partner.alias;

			for (r = 1; r <= config.numRounds; r++) {
				roundData = req.body["round" + r][i];
				data += "," + roundData.choice + "," + roundData.score;
			}

			output(data);
		});

		stream.end();
	});

	res.send(200);
}

function npdResults(req, res) {
	var now = new Date();
	var results = req.body.results;
	var config = req.body.config;
	var version = req.body.version;
	var payoff = req.body.payoff;
	var N = (payoff !== undefined) ? (parseInt(payoff.numCooperators, 10) + parseInt(payoff.numDefectors, 10)) : 0;

	var stream = fs.createWriteStream("log/npd/results." + filenameFormat(now) + ".txt");
	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output("N-Person Prisoner's Dilemma Results (v" + version + ")");
		output(now.toString());
		if (config.message) {
			output(config.message);
		}
		if (config.Rratio) {
			output("Rratio," + config.Rratio + ",R,"+ (config.Rratio*(N-1)).toFixed(2));
		}
		if (config.H) {
			output("H," + config.H);
		}

		if (payoff) {
			output("N," + N);
			output("Cooperator Payoff," + payoff.cooperatorPayoff + ",# Cooperators," + payoff.numCooperators);
			output("Defector Payoff," + payoff.defectorPayoff + ",# Defectors," + payoff.numDefectors);
			output("Total Payoff," + payoff.totalPayoff);
			output("Max Possible Total Payoff," + payoff.maxPayoff);
		}

		output("Alias,Choice,Payoff");
		_.each(results, function (result) {
			output(result.alias + "," + result.choice + "," + result.score);
		});
		stream.end();
	});

	res.send(200);
}

function teampdResults(req, res) {
	var now = new Date();
	var results = req.body.results;
	var config = req.body.config;
	var version = req.body.version;

	var stream = fs.createWriteStream("log/teampd/results." + filenameFormat(now) + ".txt");
	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output("Team Prisoner's Dilemma Results (v" + version + ")");
		output(now.toString());
		if (config.message) {
			output(config.message);
		}
		if (config.scoringMatrix) {
			output("CC," + config.scoringMatrix.CC + ",CD," + config.scoringMatrix.CD);
			output("DC," + config.scoringMatrix.DC + ",DD," + config.scoringMatrix.DD);
		}

		output(config.group1Name + " vs. " + config.group2Name);
		output("");

		output(config.group1Name + " Results");
		output("Alias,Choice,Payoff,PartnerAlias,PartnerChoice,PartnerPayoff");
		_.each(results.team1, function (result) {
			output(result.alias + "," + result.choice + "," + result.score + "," + result.partner.alias + "," + result.partner.choice + "," + result.partner.score);
		});

		output("");
		output(config.group2Name + " Results");
		output("Alias,Choice,Payoff,PartnerAlias,PartnerChoice,PartnerPayoff");
		_.each(results.team2, function (result) {
			output(result.alias + "," + result.choice + "," + result.score + "," + result.partner.alias + "," + result.partner.choice + "," + result.partner.score);
		});
		stream.end();
	});

	res.send(200);
}

function ultimatumResults(req, res) {
	var now = new Date();
	var results = req.body.results;
	var config = req.body.config;
	var version = req.body.version;

	var stream = fs.createWriteStream("log/ultimatum/results." + filenameFormat(now) + ".txt");
	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output("Ultimatum Game Results (v" + version + ")");
		output(now.toString());
		if (config.message) {
			output(config.message);
		}
		output("Total Amount," + config.amount);
		output("Offer Map," + _.map(_.keys(config.offerMap), function (key) { return key + ":" + config.offerMap[key]; }).join(","));
		output("");

		output("Alias,GiverOffer,GiverScore,GiverPartner,ReceiverOffer,ReceiverScore,ReceiverPartner");
		_.each(results, function (result) {
			output(result.alias + "," + result.giverOffer + "," + result.giverScore + "," + result.giverPartner +
				"," + result.receiverOffer + "," + result.receiverScore + "," + result.receiverPartner);
		});
		stream.end();
	});

	res.send(200);
}

function ultimatumPartitionedResults(req, res) {
	var now = new Date();
	var results = req.body.results;
	var config = req.body.config;
	var version = req.body.version;

	var stream = fs.createWriteStream("log/ultimatum-partitioned/results." + filenameFormat(now) + ".txt");
	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output("Ultimatum Game (Partitioned) Results (v" + version + ")");
		output(now.toString());
		if (config.message) {
			output(config.message);
		}
		output("Total Amount," + config.amount);
		output("Offer Map," + _.map(_.keys(config.offerMap), function (key) { return key + ":" + config.offerMap[key]; }).join(","));
		output("");

		output("Givers");
		output("Alias,AmountToKeep,Score,Partner");
		_.each(results.givers, function (result) {
			output(result.alias + "," + result.keep + "," + result.score + "," + result.partner);
		});

		output("");
		output("Receivers");
		output("Alias,Offer,Score,Partner");
		_.each(results.receivers, function (result) {
			output(result.alias + "," + result.offer + "," + result.score + "," + result.partner);
		});
		stream.end();
	});

	res.send(200);
}

function coinMatchingResults(req, res) {
	var now = new Date();
	var config = req.body.config;
	var version = req.body.version;
	var numPhases = 4;

	var choiceMap = {
		A: "H",
		B: "T",
		C: "HC", // computer guess
		D: "TC", // computer guess
	};

	var stream = fs.createWriteStream("log/coin-matching/results." + filenameFormat(now) + ".txt");
	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output("Coin Matching Results (v" + version + ")");
		output(now.toString());

		if (config.message) {
			output(config.message);
		}

		output(numPhases + " phases, " + config.roundsPerPhase + " rounds per phase, " + config.pointsPerRound + " points per round");

		var totals = {};

		outputPhase(1);
		outputPhase(2);
		outputPhase(3);
		outputPhase(4);

		// output totals
		output("");
		output("");
		output("Totals");
		output("======");
		output("Alias,Phase1Total,Phase2Total,Phase3Total,Phase4Total,OverallTotal");
		_.each(_.keys(totals), function (alias) {
			output(alias + "," + totals[alias].phase1 + "," + totals[alias].phase2 + "," +
				totals[alias].phase3 + "," + totals[alias].phase4 + "," + totals[alias].total);
		});

		function outputPhase(phaseNum) {
			var phase = req.body["phase" + phaseNum];
			if (phase == null) return;

			var pconfig = phase.config;

			var groupNames = [ pconfig.group1Name + " - " + pconfig.group1NameSuffix,
												pconfig.group2Name + " - " + pconfig.group2NameSuffix ];


			output("");
			output("Phase " + phaseNum +"," + groupNames[0] + "," + groupNames[1]);
			output("-------");
			var r, header = "Team,Alias,PartnerAlias";
			for (r = 1; r <= config.roundsPerPhase; r++) {
				header += ",P" + phaseNum + "R" + r + "Choice,P" + phaseNum + "R" + r + "Score";
			}
			header += ",P" + phaseNum + "Total";


			output(header);

			outputGroup(1);
			outputGroup(2);

			// for each participant, output choices and scores from each round in each phase
			function outputGroup(groupNum) {
				// use last round of phase to catch as many latecomers as possible
				_.each(phase.results[phase.results.length - 1]["group" + groupNum], function (participant, i) {
					var data = groupNames[groupNum - 1] + "," + participant.alias + "," + participant.partner;
					var choice;
					var phaseTotal = 0;

					var matchAlias = function (p) { return p.alias === participant.alias; };
					// for each round
					for (r = 0; r < config.roundsPerPhase; r++) {
						// may not match index in different rounds if a bot drops out in a phase or somebody is added, so look up by alias
						roundData = _.find(phase.results[r]["group" + groupNum], matchAlias);

						if (roundData) {
							choice = choiceMap[roundData.choice] || "#";
							score = roundData.score;
						}	else {
							choice = "X"; // missing (e.g. they were late and didn't play)
							score = 0;
						}
						data += "," + choice + "," + score;
						phaseTotal += parseInt(score, 10);
					}

					data += "," + phaseTotal;

					if (totals[participant.alias] === undefined) {
						totals[participant.alias] = {};
					}
					totals[participant.alias]["phase" + phaseNum] = phaseTotal;
					totals[participant.alias].total = (totals[participant.alias].total || 0) + phaseTotal;
					output(data);
				});
			}
		}

		stream.end();
	});

	res.send(200);
}


function stagHuntResults(req, res) {
	var numPhases = 3;
	var choiceMap = {
		A: "S",
		B: "H",
	};

	teamPhaseMatrixResults(req, res, "stag-hunt", "Stag Hunt", numPhases, choiceMap);
}

function pdteamResults(req, res) {
	var numPhases = 3;
	var choiceMap = {
		C: "C",
		D: "D",
	};

	teamPhaseMatrixResults(req, res, "pdteam", "Prisoner's Dilemma (team)", numPhases, choiceMap);
}

function teamPhaseMatrixResults(req, res, appDir, appName, numPhases, choiceMap) {
	var now = new Date();
	var config = req.body.config;
	var version = req.body.version;

	var stream = fs.createWriteStream("log/" +appDir + "/results." + filenameFormat(now) + ".txt");
	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output(appName + " Results (v" + version + ")");
		output(now.toString());

		if (config.message) {
			output(config.message);
		}

		output(numPhases + " phases, " + config.roundsPerPhase + " rounds per phase");

		if (config.scoringMatrix) {
			output("");
			output("Scoring Matrix");
			_.each(_.keys(config.scoringMatrix), function (key) {
				output(key + "," + config.scoringMatrix[key]);
			});
		}

		output("");
		if (choiceMap) {
			output("Choice Map");
			output(_.map(_.keys(choiceMap), function (key) { return key + " -> " + choiceMap[key]; }).join(","));
		}

		var totals = {};

		for (var i = 0; i < numPhases; i++) {
			outputPhase(i + 1);
		}

		// output totals
		output("");
		output("");
		output("Totals");
		output("======");
		var header = "Alias";
		for (i = 0; i < numPhases; i++) {
			header += ",Phase" + (i + 1) + "Total";
		}
		header += ",OverallTotal";
		output(header);

		_.each(_.keys(totals), function (alias) {
			var data = alias;
			for (var i = 0; i < numPhases; i++) {
				data += "," + totals[alias]["phase" + (i + 1)];
			}
			data += "," + totals[alias].total;

			output(data);
		});

		function outputPhase(phaseNum) {
			var phase = req.body["phase" + phaseNum];
			if (phase == null) return;

			var pconfig = phase.config;
			pconfig.group1Name = pconfig.group1Name || "Group 1";
			pconfig.group2Name = pconfig.group2Name || "Group 2";
			if (pconfig.group1NameSuffix) {
				pconfig.group1Name = pconfig.group1Name + " - " + pconfig.group1NameSuffix;
			}
			if (pconfig.group2NameSuffix) {
				pconfig.group2Name = pconfig.group2Name + " - " + pconfig.group2NameSuffix;
			}

			var groupNames = [ pconfig.group1Name, pconfig.group2Name ];


			output("");
			output("Phase " + phaseNum +"," + groupNames[0] + "," + groupNames[1]);
			output("-------");
			var r, header = "Team,Alias";
			for (r = 1; r <= config.roundsPerPhase; r++) {
				header += ",P" + phaseNum + "R" + r + "Choice,P" + phaseNum + "R" + r + "Score,P" + phaseNum + "R" + r + "Partner";
			}
			header += ",P" + phaseNum + "Total";


			output(header);

			outputGroup(1);
			outputGroup(2);

			// for each participant, output choices and scores from each round in each phase
			function outputGroup(groupNum) {
				// use last round of phase to catch as many latecomers as possible
				_.each(phase.results[phase.results.length - 1]["group" + groupNum], function (participant, i) {
					var data = groupNames[groupNum - 1] + "," + participant.alias;
					var choice, partner;
					var phaseTotal = 0;

					var matchAlias = function (p) { return p.alias === participant.alias; };
					// for each round
					for (r = 0; r < config.roundsPerPhase; r++) {
						// may not match index in different rounds if a bot drops out in a phase or somebody is added, so look up by alias
						roundData = _.find(phase.results[r]["group" + groupNum], matchAlias);

						if (roundData) {
							choice = choiceMap[roundData.choice];
							score = roundData.score;
							partner = roundData.partner;
						}	else {
							choice = "X"; // missing (e.g. they were late and didn't play)
							score = 0;
							partner = "X";
						}
						data += "," + choice + "," + score + "," + partner;
						phaseTotal += parseInt(score, 10);
					}

					data += "," + phaseTotal;

					if (totals[participant.alias] === undefined) {
						totals[participant.alias] = {};
					}
					totals[participant.alias]["phase" + phaseNum] = phaseTotal;
					totals[participant.alias].total = (totals[participant.alias].total || 0) + phaseTotal;
					output(data);
				});
			}
		}

		stream.end();
	});

	res.send(200);
}


function questionResults(req, res) {
	var now = new Date();
	var results = req.body.results;
	var config = req.body.config;
	var version = req.body.version;
	var questions = config.questions;
	if (!questions) {
		logger.warn("log Questions with no questions.");
		res.send(200);
		return;
	}

	var stream = fs.createWriteStream("log/q/results." + filenameFormat(now) + ".txt");
	stream.once('open', function(fd) {
		function output (str) {
			logger.info(str);
			stream.write(str + "\n");
		}
		output("Question Results (v" + version + ")");
		output(now.toString());
		if (config.message) {
			output(config.message);
		}

		var allResults = {};
		var allAnswerCounts = [];
		// output each question
		_.each(questions, function (q, i) {
			output("");
			output("");
			output("Question " + (i + 1) + "," + q.question);
			output("-----------");

			var results = req.body["question " + (i + 1)];
			var answerCount = { A: 0, B: 0, C: 0, D: 0, E: 0 };
			_.each(results, function (result) {
				answerCount[result.choice] = (answerCount[result.choice] || 0) + 1;
			});
			allAnswerCounts.push(answerCount);

			// output answers and counts
			output("");
			output("Count,Answer");
			_.each(_.keys(q.answers), function (key) {
				output((answerCount[key] || 0) + "," + key + " - " + q.answers[key]);
			});

			// output results
			output("");
			output("Alias,Answer");
			_.each(results, function (result) {
				output(result.alias + "," + result.choice);

				// save for summary
				if (allResults[result.alias] === undefined) {
					allResults[result.alias] = [];
				}
				allResults[result.alias].push(result.choice);
			});
		});

		output("");
		output("");
		output("Alias Summary Table");
		output("-------------------");
		var header = "Alias";
		_.each(questions, function (q, i) {
			header += ",Q" + (i + 1);
		});
		output(header)
		_.each(_.keys(allResults), function (alias) {
			output(alias + "," + allResults[alias].join(","));
		});

		output("");
		output("");
		output("Question Summary Table");
		output("----------------------");
		output("#,Question,A,B,C,D,E");
		_.each(questions, function (q, i) {
			output((i + 1) + "," + q.question + "," + _.values(allAnswerCounts[i]).join(","))
		});

		stream.end();
	});

	res.send(200);
}