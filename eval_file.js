var posix = require("posix"),
    sys = require("sys"),
    inherit = require("./inherit");

var readLength = 8 * 1024 * 1024;

exports.evalFile = function(filename)
{
	var pOpen, pRead;
	pOpen = posix.open(filename,process.O_RDONLY, 0);
	pOpen.addCallback( function(fd){ 
		//sys.print("starting read\n");
		pRead = posix.read(fd, readLength, 0);
		pRead.addCallback( function(data, bytesRead){
			//sys.print("read "+bytesRead+" from "+filename+"\n");
			//sys.print(data+"\n");
			var compiled = process.compile(data,filename);
			process.mixin(GLOBAL,compiled);
			//sys.print("eval'ed\n");
		} );
		//sys.print("unwrap "+ (pRead != null).toString()+"\n");
	} );
	pOpen.wait();
	//sys.print("wait1\n");
	//pRead.wait();
	//sys.print("wait2\n");
}
