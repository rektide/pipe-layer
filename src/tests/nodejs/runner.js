sys = require("sys"),
	events = require("events"),
	assert = require("assert"),
	path = require("path"),
	fs = require("fs"),
	http = require("http")
	

var program = process.argv[2]

// find and load common files

// build generator to recurse subdirs
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

ignoreExpected = false

// if we have expected output
if(expected) {

	// place through expected buffer
	var start = 0

	// capture output functions 
	var stock = { puts: sys.puts, print: sys.print, debug: sys.debug, log: sys.log }

	// disable-able assert
	var assert_equal = function(actual,expect) { 
		if(!ignoreExpected) 
			assert.equal(actual,expect) 
	}
	
	// redefine output functions to check against expected buffer
	sys.puts = function(str) {
		var actual = str + "\n", len = actual.length, expect = expected.substr(start,len)
		assert_equal(actual,expect)
		start += len
		stock.puts(str)
	}

	sys.print = function(str) {
		var actual = str, len = actual.length, expect = expected.substr(start,len)
		assert_equal(actual,expect)
		start += len
		stock.print(str)
	}

	sys.debug = function(str) {
		var actual = str + "\n", len = actual.length, expect = expected.substr(start,len)
		assert_equal(actual,expect)
		start += len
		stock.debug(str)
	}

	sys.log = function(str) {
		var actual = str + "\n", len = actual.length, expect = expected.substr(start,len)
		assert_equal(actual,expect)
		start += len
		stock.log(str)
	}
}

// eval program itself

program_content = fs.readFileSync(program)
process.compile(program_content,program)

