var events = require("events"),
    http = require("http"),
    path = require("path"),
    posix = require("posix"),
    sys = require("sys"),
    inherit = require("./inherit");

var loadFiles = [
	"chain.js", "base.js",
	"cookie.js", "user.js", "xpipe.js", "reverse.js", "fs.js"
];

var readLength = 8 * 1024 * 1024;
for(var f in loadFiles)
{
	var filename = loadFiles[f];
	sys.print("evaluating "+filename+"\n");
	
	var file = posix.open(""+filename, process.O_RDONLY, 0).wait();
	var data = posix.read(file, readLength).wait()[0];
	var context = eval(data,context);
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


