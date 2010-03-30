// filter looks for a "delay" in search query, and delays processing.
// uses a defer queue, and a fixed interval timer that continues any deferred items for the current tick.
var DelayFilter = function(interval,queryName,minInterval,maxInterval) {

	this.name = "DelayFilter"

	this.tick = 0
	this.interval = interval/1000
	this.defer = []
	this.queryName = queryName || "delay"
	this.minInterval = minInterval || 0
	this.maxInterval = maxInterval || 60

	// write interval handler
	this.handler = function(slf) {
		
		// look up deferred slot
		var t = slf.tick++
		var slot = slf.defer[t]
		if(!slot)
			return
		
		// for all contexts in the slot
		for(var i in slot) {
			var ctx = slot[i]
			// continue running the chain
			ctx.chain.chainResult.emit("success",ctx,false)
		}
		
		// slot has been fired, remove from defer queue.
		delete slf.defer[t]
	}
	// assign interval handler
	this.timer = setInterval(this.handler, interval, this)
	
	this.execute = function(ctx) {
		
		// find and validate delay

		// get delay query parameter
		var query = this.parseUrl(ctx).query
		// no query, we do nothing
		if(query===undefined)
			return false
		
		var delay = query[this.queryName]
		
		// no delay, we do nothing
		if(delay===undefined)
			return false
		
		// delay isnt a number	
		if(isNaN(delay))
			return this.failure(ctx,"delay parameter specified but invalid",400)
		
		// range check
		if(delay < minInterval)
			return this.failure(ctx,"delay parameter too small",400)
		if(delay > maxInterval)
			return this.failure(ctx,"delay parameter too big",400)
		
		
		// find tick specified for the delay
		var tick = Math.ceil(delay/this.interval) + this.tick
		
		// retrieve defer slot for the tick
		var slot = this.defer[tick]
		if(!slot)
			slot = this.defer[tick] = []
		
		// defer this request
		slot.push(ctx)
		return "defer"
	}
}

inherit.inherit(DelayFilter,DefaultBaseFilter)
