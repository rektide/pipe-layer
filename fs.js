var FileSystemFilter = function(basePath)
{
	var readLength = 8*1024*1024;

	this.name = "FileSystemFilter";

	this.execute = function(ctx)
	{
		var url = ctx.request.url;
		var pth = path.join(basePath,url);
		
		posix.open(pth,process.O_RDONLY,0)
		  .addCallback(function(fd){
			var response = ctx.response;
			response.sendHeader(200,{});
			posix.read(fd,readLength,0).addCallback(function(data,len){
				var response = ctx.response;
				response.sendBody(data);
				response.finish();
				
				Chain.resume(ctx);
			});
		})
                  .addErrback(function(){
			var response = ctx.response;
			response.sendHeader(404,{});
			response.finish();

			Chain.resume(ctx);
		});

		return "defer";
	}
	
	
};
