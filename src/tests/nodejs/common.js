// shared default settings

PORT=8765

// utility function

var S4 = function () { return (((1+Math.random())*0x10000)|0).toString(16).substring(1) }

// html test runner

var runHtmlTests = function(tests,handler) {

	var tick = 0
	var ran = 0
	var timer

	var h = handler || headerHandler

	// tick 
	var tickHandler = function() {
		var n = tick++
		for(var i in tests) {
			var test = tests[i]
			if(test[3] == n) {
				++ran
				sys.log("dispatching "+i+" "+test[1])
				dispatchTest(i,test,h)
			}
		}
		if(ran == tests.length)
			clearInterval(tickTimer)
	}
	
	tickTimer = setInterval(tickHandler,1000)
}

// kick off one http request

var dispatchTest = function(n,test,handler) {
	var client = http.createClient(PORT,"localhost")
	var request = client.request(test[0],test[1],test[2])
	request.addListener('response',function(response) {
		handler(n,test,response)
		//response.addListener('data',function(chunk) {
		//	handler(n,test,response,chunk)
		//})
	})
	request.close()
}

// print out headers for response packets

var headerHandler = function(n,test,response,data) {

	sys.log("handler "+test[1])

	// only show headers
	if(data !== undefined)
		return
	
	// print status
	sys.puts(n+" "+response.statusCode+" "+test[1])
	// print headers
	for(var h in response.headers)
		sys.puts(n+" "+h+": "+response.headers[h])
	
}

