var BaseFilter = function() {
	
	this.failure = function(ctx,cause) {
		
		var resp = ctx.response;
		resp.sendHeader(400, {});
		resp.sendBody(cause);
		resp.finish();
		
		return true;
	}

}
