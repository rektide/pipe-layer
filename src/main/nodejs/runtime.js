var events = require("events"),
    http = require("http"),
    path = require("path"),
    fs = require("fs"),
    sys = require("sys"),
    inherit = require("./inherit");

var loadFiles = [
	"utility.js",
	"chain.js", "base.js",
	"cookie.js", "user.js", "xpipe.js", "reverse.js", "fs.js"
];

var readLength = 8 * 1024 * 1024;
for(var f in loadFiles)
{
	var filename = loadFiles[f];
	sys.print("evaluating "+filename+"\n");
	
	var fd = fs.openSync(""+filename, process.O_RDONLY, 0)
	var data = fs.readSync(fd, readLength)[0]
	//process.compile(data, filename)
	eval(data)
};


var userStore = new Object();

var initialChain = [ 
	new SessionCookieFilter(),
	new UserStoreFilter(userStore), 
	new XPipeFilter(),
	new ReverseHttpFilter(userStore,userDomainMatch),
	new FileSystemFilter("./tests/")
];


http.createServer(function(request,response) {
	
	var pc = new PipeContext(request,response);
	var chain = pc.chain = new Chain(initialChain);
	
	//chain.chainResult.addCallback( function(ctx,result){
	//	sys.debug("result!");
	//});
	
	chain.result.addErrback( function(ctx,err){
		sys.debug("error "+err);
	});
	
	chain.execute(pc);
	
}).listen(8765);


