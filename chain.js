var PipeContext = function(request,response){

	this.request = request;
	this.response = response;
}

var Chain = function(initialChain)
{
	this.chain = initialChain;
	this.chainPosition = 0;
	this.filterStack = [];
		
	this.saveError = null;
	this.saveResult = null;
	this.filterHandled = true;

	this.chainResult = new events.Promise(); // callback for individual chains
	this.filterResult = new events.Promise(); // callback for individual filters
	
	this.result = new events.Promise(); // net chain output

	this.execute = function(ctx) {

		var chain = this.popStack();

		// no more entries left	
		if(!chain)
			this.doFilters(ctx);
		
		sys.debug("CHAIN ITER "+chain.name);

		// check if chain is a filter
		if(chain["postProcess"]) 
			ctx.chain.filterStack.push(chain);

		// execute
		try {		
			var result = chain.execute(ctx);
		} catch (err) {
			// fire failure
			this.chainResult.emitError(ctx,err);
		}
	
		// flagged to wait for someone else to fire completion
		if(result=="defer")
			return;
		
		// fire completion
		this.chainResult.emitSuccess(ctx,result);

		sys.debug("CHAIN DONE");
	}

	this.chainSuccess = function(ctx,result) {
	
		sys.debug("CHAIN SUCCESS");
		var chain = ctx.chain;
		if(result)
			chain.doFilters(ctx);
		else
			chain.execute(ctx);
	}

	this.chainError = function(ctx,err) {

		sys.debug("CHAIN ERROR");
		var chain = ctx.chain;
		chain.saveError = err;
		chain.filterHandled = false;
		chain.doFilters(ctx);
	}

	this.doFilters = function(ctx) {

		sys.debug("CHAIN FILTER");	
		var filter = this.filterStack.pop();
		if(filter)
		{
			try {
				var result = filter.postProcess(ctx,this.saveErr);
			}
			catch(err) {}
			if(result == "defer")
				return;

			this.filterResult.emitSuccess(ctx,result);
		}
		else {
			if(!this.filterHandled)
				this.result.emitError(ctx,this.saveErr);
			else
				this.result.emitSuccess(ctx,this.saveResult);
		}
	}
	
	this.filterSuccess = function(ctx,result) {
		
		sys.debug("CHAIN FILTER SUCCESS");
		var chain = ctx.chain;
		if(result)
			chain.filterHandled = true;
		chain.doFilters(ctx);
	}

	this.filterError = function(ctx,err) {
		
		sys.debug("CHAIN FILTER FAIL");
		ctx.chain.doFilters(ctx);
	}

	this.popStack = function() {
		
		return this.chain[this.chainPosition++];
	}

	this.setChain = function(chain) {

		this.chain = chain;
		this.chainPosition = 0;	
	}

	this.chainResult.addListener(this.chainSuccess);
	this.chainResult.addErrback(this.chainError);
	this.filterResult.addListener(this.filterSuccess);
	this.filterResult.addErrback(this.filterError);
}

var DefaultChain = new Chain();
