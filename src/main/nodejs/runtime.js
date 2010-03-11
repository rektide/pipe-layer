var events = require("events"),
    http = require("http"),
    path = require("path"),
    fs = require("fs"),
    sys = require("sys"),
    inherit = require("./inherit")


// dependencies to be used in runtime

var loadFiles = [
	"utility.js",
	"chain.js", "base.js",
	"cookie.js", "user.js", "xpipe.js", "reverse.js", "fs.js"
]


// evaluate all dependencies

// find pipe layer nodejs' home directory
var dir = process.argv[1]
dir = dir.substr(0,dir.lastIndexOf("/")+1)

// load dependencies from file, and evaluate
var readLength = 8 * 1024 * 1024
for(var f in loadFiles)
{
	var filename = loadFiles[f]
	sys.print("evaluating "+filename+"\n")

	// open file and read
	var fd = fs.openSync(dir+filename, process.O_RDONLY, 0)
	var data = fs.readSync(fd, readLength)[0]
	// evaluate
	//process.compile(data, filename)
	eval(data)
}


// various execution chains

// chain for html code

var html5FsChain = new Chain([
	new FileSystemFilteR("src/main/html")
])

// chain for test

var testFsChain = new Chain([
	new FileSystemFilter("src/tests/html")
])

// chain for reverse

var userStore = new Object()
var reverseChain = new Chain([ 
	new SessionCookieFilter(),
	new UserStoreFilter(userStore), 
	new XPipeFilter(),
	new ReverseHttpFilter(userStore,userDomainMatch),
	new FileSystemFilter("src/tests/nodejs","pipe")
])

// chain for a router pointing to different contexts

var router1 = new Chain([RegexRouter( Router.path, {
	/\/pipe^/: reverseChain,
	/\/pipe/.*/: html5FsChain,
	/\/test/: testFsChain,
})])


// http server

srv1 = http.createServer(function(request,response) {

	// build a context	
	var pc = new PipeContext(request,response)
	// get a new chain from our template chain
	var chain = pc.chain = new Chain(router1)
	
	//chain.chainResult.addListener('success', function(ctx,result){
	//	sys.debug("result!")
	//})

	// throw errors to consome
	chain.result.addListener('error', function(ctx,err){
		sys.debug("error "+err)
	})
	
	chain.execute(pc)
	
})

// commence

sys.debug("starting server listen")
srv1.listen(8765)


