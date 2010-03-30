var runHtmlTests = function(tests,handler) {
	
	var tick = 0
	var ran = 0
	var timer

	handler = handler || headerHandler
	
	var timerHandler = function() {
		var n = tick++
		for(var i in tests) {
			var test = tests[i]
			if(test[3] == n) {
				++ran
				dispatchTest(i,test,handler)
			}
		}
		if(ran == tests.length)
			clearInterval(timer)
	}
	
	timerHandler()
	timer = setInterval(timerHandler,1000)
}


var dispatchTest = function(n,test,handler) {
	ignoreExpected = true
	sys.debug("running "+n)
	var client = http.createClient(8765,"localhost")
	var request = client.request(test[0],test[1],test[2])
	request.addListener('response',function(response) {
		handler(n,test,response)
		response.addListener('data',function(chunk) {
			handler(n,test,response,chunk)
		})
	})
	request.close()
}

var headerHandler = function(n,test,response,data) {

	// only show headers
	if(data !== undefined)
		return
	
	// print status
	sys.puts(n+" "+response.statusCode+" "+test[1])
	// print headers
	for(var h in response.headers)
		sys.puts(n+" "+h+": "+response.headers[h])
	
}
