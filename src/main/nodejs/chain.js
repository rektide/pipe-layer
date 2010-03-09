var PipeContext = function(request,response){

	this.request = request
	this.response = response
}

var Chain = function(initialChain)
{
	this.chain = initialChain.slice(0) // copy
	this.chainPosition = 0
	this.filterStack = []
		
	this.saveError = null
	this.saveResult = null
	this.filterHandled = true

	this.chainResult = new events.EventEmitter() // callback for individual chains
	this.filterResult = new events.EventEmitter() // callback for individual filters
	
	this.result = new events.EventEmitter() // net chain output

	this.execute = function(ctx) {

		var chain = this.popStack()

		// no more entries left	
		if(!chain)
			this.doFilters(ctx)
		
		sys.debug("CHAIN ITER "+chain.name)

		// check if chain is a filter
		if(chain["postProcess"]) 
			ctx.chain.filterStack.push(chain)

		// execute
		try {		
			var result = chain.execute(ctx)
		} catch (err) {
			// fire failure
			this.chainResult.emit("error",ctx,err)
		}
	
		// flagged to wait for someone else to fire completion
		if(result=="defer")
			return
		
		// fire completion
		this.chainResult.emit("success",ctx,result)
	}

	this.chainSuccess = function(ctx,result) {

		var chain = ctx.chain
		if(result)
			chain.doFilters(ctx)
		else
			chain.execute(ctx)
	}

	this.chainError = function(ctx,err) {

		sys.debug("CHAIN ERROR")
		var chain = ctx.chain
		chain.saveError = err
		chain.filterHandled = false
		chain.doFilters(ctx)
	}

	this.doFilters = function(ctx) {

		var filter = this.filterStack.pop()
		if(filter)
		{
			sys.debug("CHAIN FILTER "+filter.name)
			try {
				var result = filter.postProcess(ctx,this.saveErr)
			}
			catch(err) {}
			if(result == "defer")
				return

			this.filterResult.emit("success",ctx,result)
		}
		else {
			if(!this.filterHandled)
				this.result.emit('error',ctx,this.saveErr)
			else
				this.result.emit('success',ctx,this.saveResult)
		}
	}
	
	this.filterSuccess = function(ctx,result) {
		
		var chain = ctx.chain
		if(result)
			chain.filterHandled = true
		chain.doFilters(ctx)
	}

	this.filterError = function(ctx,err) {
		
		ctx.chain.doFilters(ctx)
	}

	this.popStack = function() {
		
		return this.chain[this.chainPosition++]
	}

	this.setChain = function(chain) {

		this.chain = chain
		this.chainPosition = 0
	}

	this.chainResult.addListener("success",this.chainSuccess)
	this.chainResult.addListener("error",this.chainError)
	this.filterResult.addListener("success",this.filterSuccess)
	this.filterResult.addListener("error",this.filterError)
}

var DefaultChain = new Chain()
