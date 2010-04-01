var XPipeFilter = function() {

	this.name = "XPipeFilter"
	
	this.execute = function(ctx) {
	
		// lookup user context	
		var cookie = ctx.cookie
		var user = ctx.user
	
		// retrieve pipeId and seq
		var req = ctx.request
		var pipe,seq,pipeId = req.headers["x-pipe"]

		if(!pipeId) {

			// no pipeId; should be being created
			pipeId = req.headers["x-create-pipe"]
			if(!pipeId)
				return this.failure(ctx,"no X-Pipe data found")
			
			seq = 1
			pipe = user.pipes[pipeId] = this.createPipe(ctx,pipeId)
		} else {

			pipe = user.pipes[pipeId]
			if(!pipe)
				return this.failure(ctx,"pipe not found")
			
	 		seq = req.headers["x-seq"]
			if(!seq)
				return this.failure(ctx,"sequence not included")
			// todo: range check sequence?
		}

		ctx.pipe = pipe
		ctx.seq = seq

		// set pipes mru
		pipe.mru = user.mru
		
		// enqueue reply, provide a proxy for this context
		user.responses.push(ctx.response)
		ctx.response = new XPipeResponse(ctx)
		
		return false
	}
	
	this.createPipe = function(ctx,pipeId) {
	
		var pipe = new Object()
		pipe.pipeId = pipeId
		pipe.seq = 1
		pipe.rseq = 1
		pipe.deferred = []
		return pipe
	}
}

inherit.inherit(XPipeFilter,DefaultBaseFilter)

var XPipeResponse = function(ctx) {
		
	this.ctx = ctx
	this.response = null
	
	this.sendHeader = function(statusCode, headers) {
		
		//sys.debug("xpr sendHeader ")

		if(!this.isTop()) {
			sys.debug("deferring")
			this.buildDeferred()
			this.headers = headers
			this.statusCode = statusCode
			return
		}
	
		// ensure XPipe headers.
		headers["X-Pipe"] = this.ctx.pipe.pipeId
		headers["X-Seq"] = this.ctx.seq

		var user = this.ctx.user
		
		// load all system headers
		DefaultBaseFilter.import_system_headers(user,headers)
		
		// retrieve most recent response
		var response = this.response = user.responses.shift()
		// and send
		response.sendHeader(statusCode,headers)
	}
	
	this.write= function(chunk, encoding) {
	
		//sys.debug("xpr write")
		
		if(!this.isTop()) {
			this.chunks.push(chunk)
			this.encodings.push(encoding)
			return
		} else if(this.headers) {
			// we're at the top, but there are headers queued from when we werent
			this.despool()
		}
	
		var response = this.response
		response.write.apply(response,arguments)
	}
	
	this.close= function() {
	
		if(!this.isTop()) {
			this.done = true
			return;
		} else if(this.headers) {
			// we're at the top, but there are headers queued from when we werent
			this.despool()
		}
		
		//sys.debug("xpipe close")
		this.response.close()
	
		var pipe = this.ctx.pipe
		pipe.seq++
		
		// look for deferred to fire.
		if(pipe.deferred.length && pipe.deferred[0].seq == pipe.seq)
			pipe.deferred.shift().response.despool()
	}

	this.isTop = function() {
	
		//sys.debug("is top "+this.ctx.seq+" "+this.ctx.pipe.seq)
		return this.ctx.seq == this.ctx.pipe.seq
	}

	this.despool = function() {
	
		//sys.debug("xpr despool"+this.ctx.ticket)
		
		this.sendHeader(this.statusCode,this.headers)
		delete this.headers
		
		var response = this.response
		for(var i = 0; i < this.chunks.length; ++i)
			response.write(this.chunks[i],this.encodings[i])

		if(this["done"]) {
			this.close()
		}
	}
	
	this.buildDeferred = function()
	{
		//this.headers = null
		//this.statusCode = null
		this.chunks= new Array()
		this.encodings = new Array()
		this.done = false

		orderedInsert(this.ctx.pipe.deferred,this.ctx,function(a,b){return a.seq - b.seq})
	}
}

inherit.inherit(XPipeFilter,DefaultBaseFilter)
