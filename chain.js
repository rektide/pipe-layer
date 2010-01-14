var PipeContext = function(request,reply){

	this.request = request;
	this.reply = reply;

}

var Chain = function()
{
	this.execute = function(ctx) {
		var filterStack = new Array(), saveResult = false, saveErr, filter;
		for (var command in this) {
			if(!isNumeric(command)) continue;
			try {
				if(command["postProcess"] != null)
					filterStack.push(command);
				saveResult = command.execute(ctx);
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
