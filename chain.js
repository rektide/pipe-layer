var PipeContext = function(request,response){

	this.request = request;
	this.response = response;

}

var Chain = function()
{
	this.execute = function(ctx) {
		var filterStack = new Array(), saveResult = false, saveErr, filter;
		for (var command in this) {
			if(isNaN(command)) continue;
			try {
				var target = this[command];
				sys.print("chain "+target.name+"\n");
				if(target["postProcess"] != null)
					filterStack.push(target);
				saveResult = target.execute(ctx);
				if(saveResult)
					break;
			}
			catch(err) {
				saveErr = err;
				break;
			}
		}
		
		filterHandled = saveErr == null
		while (filter = filterStack.pop()) {
			try {
				if(filter.postProcess(ctx,saveErr))
					filterHandled = true;
			} catch(err) {}
		}
		if (!filterHandled) {
			throw saveErr;
		}
		
		return saveResult;
	}
}

var DefaultChain = new Chain();
