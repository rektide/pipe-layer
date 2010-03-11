var FileSystemFilter = function(base,urlPrefix)
{
	var readLength = 8*1024*1024

	this.name = "FileSystemFilter"

	this.execute = function(ctx)
	{
		// get url
		var url = ctx.request.url
		// truncate prefix
		if(url.slice(0,urlPrefix.length) == urlPrefix)
			url = url.substr(urlPrefix.length)
	
		// open path
		var pth = path.join(base,url)
		fs.open(pth,process.O_RDONLY,0,function(err,fd) {
			
			if(err) {
				this.failure(ctx,null,404)
				return
			}

			// read contents
			fs.read(fd,readLength,0, function(err,data,len){

				if(err) {
					this.failure(ctx,null,500)
					return
				}

				// write file contents as response
				
				var response = ctx.response
				response.sendHeader(200,{"Content-Length": data.length})
				response.sendBody(data)
				response.finish()
			
				this.success(ctx)
			})
		})
		
		return "defer"
	}
}

inherit.inherit(FileSystemFilter,DefaultBaseFilter)
