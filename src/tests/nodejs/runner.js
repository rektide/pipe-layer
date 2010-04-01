sys = require("sys"),
	events = require("events"),
	assert = require("assert"),
	path = require("path"),
	fs = require("fs"),
	http = require("http")
	

var program = process.argv[2]

// find and load common files

// build generator to recurse subdirs to target
var common = "common.js", start = 0
var commonGenerator = function() {

	if(start == -1)
		return null

	var fragment = program.substr(0,start)
	start = program.indexOf("/",start) + 1
	if(start == 0)
		start = -1
	return fragment + common
	
}

// evaluate all common files in subdirs
var filename = commonGenerator()
while(filename) {

	var file = null
	try {
		file = fs.readFileSync(filename)
	} catch (ex) {}
	if(file)
		process.compile(file,filename)

	filename = commonGenerator()
}

// process expected output

// try to get expected output
var expected = null
try {
	expected = fs.readFileSync(program.replace(".js",".txt"))
} catch (ex) {}

// if we have expected output
if(expected) {

	CHECK = { puts: true, print: true, debug: false, log: false }
	LOGGING=false

	// place through expected buffer
	var start = 0

	// capture output functions 
	var stock = { puts: sys.puts, print: sys.print, debug: sys.debug, log: sys.log }

	// redefine output functions to check against expected buffer
	sys.puts = function(str) {
		stock.puts(str)
		if(LOGGING) return
		if(!CHECK.puts) return
		var actual = str + "\n", len = actual.length, expect = expected.substr(start,len)
		assert.equal(actual,expect)
		start += len
	}

	sys.print = function(str) {
		stock.print(str)
		if(!CHECK.print) return
		var actual = str, len = actual.length, expect = expected.substr(start,len)
		assert.equal(actual,expect)
		start += len
	}

	sys.debug = function(str) {
		stock.debug(str)
		if(!CHECK.debug) return
		var actual = str + "\n", len = actual.length, expect = expected.substr(start,len)
		assert.equal(actual,expect)
		start += len
	}

	sys.log = function(str) {
		LOGGING=true
		stock.log(str)
		LOGGING=false
		if(!CHECK.log) return
		var actual = str + "\n", len = actual.length, expect = expected.substr(start,len)
		assert.equal(actual,expect)
		start += len
	}
}

// eval program itself

program_content = fs.readFileSync(program)
process.compile(program_content,program)

