var ReverseHttpFilter = function(store,match) {

	this.name = "ReverseHttpFilter"
	
	this.store = store
	this.match = match

	this.execute = function(ctx) {
		var target = this.match(ctx,this.store)
		if(!target)
			return false
	
		sys.debug("Reverse Commencing!")
		var rc = new ReverseClient(ctx,target[2].rseq++)
		rc.request(ctx.request.method, ctx.request.url, {})
		ctx.request.addCallback('data',function(chunk){
			rc.write(chunk)
		})
		ctx.request.addCallback('end',function(){
			rc.close()
		})

		// reply affirmative to server
		var resp = ctx.response
		resp.sendHeader(204,{}) // success
		resp.close()
	}
	
}

inherit.inherit(ReverseHttpFilter,DefaultBaseFilter)

var ReverseClient = function(ctx,rseq)
{
	this.ctx = ctx
	this.rseq = rseq
	this.user = ctx.user
	this.response = null
	
	this.request = function(method,path,request_headers) {
		
		if(!method)
			method = "GET"
		
		// fetch response	
		var response = this.response = this.user.responses.shift()

		// START CHUNKED TRANSFER RESPONSE
		
		// chunked headers
		var headers = {"Transfer-Encoding": "chunked", "Content-Type": "message/http"}
		
		// install system headers
		import_system_headers(this.user, headers)
		
		// xpipe sequencing
		headers["X-Pipe-Id"] = this.ctx.pipe.pipeId
		headers["X-RSeq"] = this.rseq

		// send header stub	
		response.sendHeaders(200, headers)
		
		// SEND CLIENT ENVELOPE
		
		// build packet
		var replyFragments = [ method, " ", path, "HTTP/1.1", "\n" ]
		for(var header in request_headers)
			replyFragments.push(header, ": ", request_headers[header], "\n")
		replyFragments.push("\n")
		var replyBody = replyFragments.join("")
	
		// content length	
		var hexLen = reply.length.toString(16)
		
		// compose & send
		var reply = [ hexLen, "\n", replyBody, "\n" ].join()
		response.write(reply)
	}
	
	this.write= function(chunk,encoding) {
		var hexLen = chunk.length.toString(16)
		var reply = [ hexLen, "\n", chunk, "\n" ]
		this.response.write(chunk)
	}

	this.close= function(responseListener) {
		this.response.write("0\n")
		this.response.close()
	}
}



var userPathMatch = function(ctx,store) {

	var url = this.parseUrl(ctx.request).pathname
	var paths = url.split("/")

	if(paths[0] != "users" || isNaN(paths[1]) || isNaN(paths[2]))
		return

	var user = store[paths[1]]
	if(!user)
		return
	var pipe = user.pipes[paths[2]]
	if(!pipe)
		return
	
	return [user,pipe]
}


var userDomainMatch = function(ctx,store) {

	var host = ctx.request.headers["host"]
	if(!/^users\./.exec(host))
		return
	
	var url = ctx.request.url
	var keyArray = /^\/([\w]+)\/([\w]+)/.exec(url)
	if(!keyArray)
		return
	
	var user = store[keyArray[1]]
	if(!user)
		return
	var pipe = user.pipes[keyArray[2]]
	if(!pipe)
		return

	sys.debug("reverse targets "+keyArray[1]+" "+keyArray[2])

	return [user,pipe]
}
