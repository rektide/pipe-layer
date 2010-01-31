var BaseFilter = function() {

	this.name = "BaseFilter";
	
	this.failure = function(ctx,cause) {
		
		var resp = ctx.response;
		resp.sendHeader(400, {});
		resp.sendBody(cause);
		resp.finish();
		
		return true;
	}

	this.import_system_headers = function(user,headers)
	{
		var system_headers = user.system_headers;
		user.system_headers = {};
		for(var header in system_headers)
			headers[header] = system_headers[header];
	
	}
}

DefaultBaseFilter = new BaseFilter();
