var XPipeFilter = function() {

	this.name = "XPipeFilter";	
	
	this.execute = function(ctx) {
	
		// lookup user context	
		var cookie = ctx.cookie;
		var user = ctx.user;
	
		// retrieve pipeId and seq
		var req = ctx.request;
		var pipe,seq,pipeId = req.headers["x-pipe"];

		if(!pipeId) {

			// no pipeId; should be being created
			pipeId = req.headers["x-create-pipe"];
			if(!pipeId)
				return this.failure(ctx,"no X-Pipe data found");
			
			seq = 1;
			pipe = user.pipes[pipeId] = this.createPipe(ctx,pipeId);
		} else {

			pipe = user.pipes[pipeId];
			if(!pipe)
				return this.failure(ctx,"pipe not found");
			
	 		seq = req.headers["x-seq"];
			if(!seq)
				return this.failure(ctx,"sequence not included");
			// todo: range check sequence?
		}

		ctx.pipe = pipe;
		ctx.seq = seq;
		
		// enqueue reply, provide a proxy for this context
		user.responses.push(ctx.response);
		ctx.response = new XPipeResponse(ctx);
		
		return false;
	}
	
	this.createPipe = function(ctx,pipeId) {
	
		var pipe = new Object();
		pipe.pipe = pipe;
		pipe.seq = 1;
		pipe.rseq = 1;
		pipe.deferred = [];
		return pipe;
	}
}

inherit.inherit(XPipeFilter,DefaultBaseFilter);

var XPipeResponse = function(ctx) {
		
	this.ctx = ctx;
	this.response = null;
	
	this.sendHeader = function(statusCode, headers) {
		
		//sys.debug("xpipe sendHeader ");
			
		// ensure XPipe headers.
		headers["X-Pipe"] = this.ctx.pipe.pipeId;
		headers["X-Seq"] = this.ctx.seq;

		if(!this.isTop())
		{
			sys.debug("deferring");
			this.buildDeferred();
			this.headers = headers;
			this.statusCode = statusCode;
			
			return;
		}

		var user = this.ctx.user;
		
		// load all system headers
		DefaultBaseFilter.import_system_headers(user,headers);
		
		// retrieve most recent response
		var response = this.response = user.responses.shift();
		// and send
		response.sendHeader(statusCode,headers);
	}
	
	this.sendBody = function(chunk, encoding) {
	
		//sys.debug("xpipe sendBody");
		
		if(!this.isTop()) {
			this.chunks.push(chunk);
			this.encodings.push(encoding);
			return;
		} else if(this.headers) {
			// we're at the top, but there are headers queued from when we werent
			this.despool();
		}
		
		var response = this.response;
		response.sendBody.apply(response,arguments);
	}
	
	this.finish = function() {
	
		//sys.debug("xpipe finish");
			
		if(!this.isTop())
		{
			this.done = true;
			return;
		} else if(this.headers) {
			// we're at the top, but there are headers queued from when we werent
			this.despool();
		}
	
		var pipe = this.ctx.pipe
			
		this.response.finish();
		pipe.seq++;
		
		// look for deferred to fire.
		while(pipe.deferred.length && pipe.deferred[0].seq == pipe.seq)
		{
			sys.debug("follow up rseq to send");
			pipe.deferred.shift().despool();
			pipe.seq++
		}
	}

	this.isTop = function()
	{
		//sys.debug("is top "+this.ctx.seq+" "+this.ctx.pipe.seq+"\n");
		return this.ctx.seq == this.ctx.pipe.seq;
	}

	this.despool = function()
	{
		//sys.debug("DESPOOL");
		this.sendHeaders(this.statusCode,this.headers);
		this.headers = null;
		
		var response = this.response;
		for(var i = 0; i < this.chunks.length; ++i)
			response.sendBody.call(response,this.chunks[i],this.encodings[i]);
	}
	
	this.buildDeferred = function()
	{
		//this.headers = null;
		//this.statusCode = null;
		this.chunks= new Array();
		this.encodings = new Array();
		this.done = false;

		orderedInsert(this.ctx.pipe.deferred,this.ctx,function(a,b){return a.seq - b.seq});
	}
}

inherit.inherit(XPipeFilter,DefaultBaseFilter);
