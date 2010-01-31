exports.inherit = function(target) 
{
	var sources = new Array(arguments).slice(1);
	for(var i in sources)
	{
		var source = sources[i];
		for(var proto in source.prototype)
		{
			if(!target.prototype[proto])
				target.prototype[proto] = source.prototype[proto];
		}
	}
}
