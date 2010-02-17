var FileSystemFilter = function(basePath)
{
	var readLength = 8*1024*1024;

	this.name = "FileSystemFilter";

	this.execute = function(ctx)
	{
		var url = ctx.request.url;
		var pth = path.join(basePath,url);
		
		posix.open(pth,process.O_RDONLY,0).addCallback(function(fd){
			posix.read(fd,readLength,0).addCallback(function(data,len){
				var response = ctx.response;
				response.sendHeader(200,{"Content-Length": data.length});
				response.sendBody(data);
				response.finish();
				
				ctx.chain.chainResult.emit("success",ctx,true);
			});
		}).addErrback(function(){
			var response = ctx.response;
			response.sendHeader(404,{});
			response.finish();
			
			ctx.chain.chainResult.emit("success",ctx,true);
		});

		return "defer";
	}
};
