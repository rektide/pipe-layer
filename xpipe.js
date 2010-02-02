var XPipeFilter = function() {

	this.name = "XPipeFilter";	
	
	this.execute = function(ctx) {
	
		// lookup user context	
		var cookie = ctx.cookie;
		var user = ctx.user;
	
		// retrieve pipeId and seq
		var req = ctx.request;
		var pipe,seq,pipeId = req.headers["x-pipe-id"];

		for(var header in req.headers)
		{
			//sys.debug("header "+header+": "+req.headers[header]);
			var i;
		}
		
		if(!pipeId) {
			// no pipeId; is it being created?
			pipeId = req.headers["x-create-pipe-id"];
			if(!pipeId)
				return this.failure(ctx,"no X-Pipe-Id data found");
			
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
		pipe.pipeId = pipeId;
		pipe.seq = 1;
		pipe.rseq = 1;
		pipe.deferred = new Array();
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
		headers["X-Pipe-Id"] = this.ctx.pipe.pipeId;
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
		
		this.response.finish();
		this.ctx.pipe.seq++;
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
	}
}

inherit.inherit(XPipeFilter,DefaultBaseFilter);
