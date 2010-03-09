var FileSystemFilter = function(basePath)
{
	var readLength = 8*1024*1024

	this.name = "FileSystemFilter"

	this.execute = function(ctx)
	{
		var url = ctx.request.url
		var pth = path.join(basePath,url)
		
		fs.open(pth,process.O_RDONLY,0,function(err,fd) {
			
			if(err) {
				this.failure(ctx,null,404)
				return
			}

			fs.read(fd,readLength,0, function(err,data,len){

				if(err) {
					this.failure(ctx,null,500)
					return
				}

				var response = ctx.response
				response.sendHeader(200,{"Content-Length": data.length})
				response.sendBody(data)
				response.finish()
			
				this.success(ctx)	
			})
		}
		
		return "defer"
	}
}

inherit.inherit(FileSystemFilter,DefaultBaseFilter)
