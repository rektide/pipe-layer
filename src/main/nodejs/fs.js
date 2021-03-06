var FileSystemFilter = function(base,urlPrefix)
{
	var readLength = 8*1024*1024

	this.name = "FileSystemFilter"
	this.urlPrefix = urlPrefix || ""
	this.base = "./" + base

	this.execute = function(ctx) {

		sys.debug("FS EXEC "+ctx.ticket)
		
		// get url
		var url = this.parseUrl(ctx).pathname
		if(url.slice(0,this.urlPrefix.length) == this.urlPrefix)
			url = url.substr(this.urlPrefix.length)
		
		// open path
		var pth = path.join(this.base,url)
		var slf = this
		fs.open(pth,process.O_RDONLY,0,function(err,fd) {
			
			if(err) {
				sys.debug("FS ERR OPEN "+pth+" "+err)
				slf.failure(ctx,null,404)
				return
			}

			// read contents
			fs.read(fd,readLength,0,null,function(err,data,len){

				if(err) {
					sys.debug("FS ERR READ "+pth+" "+err)
					slf.failure(ctx,null,500)
					return
				}

				// write file contents as response
				
				var response = ctx.response
				response.sendHeader(200,{"Content-Length": data.length-1})
				response.write(data)
				response.close()
			
				slf.success(ctx)
				sys.debug("FS DONE "+pth)
			})
		})
		
		return "defer"
	}
}

inherit.inherit(FileSystemFilter,DefaultBaseFilter)
