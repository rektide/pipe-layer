// utilities

// uuid -- adapted from http://note19.com/2007/05/27/javascript-guid-generator/
var uuidY = [8,9,'a','b']
function S4() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1) }
function uuid() { return [S4(),S4(),"-",S4(),"-4",S4().substring(1),"-",uuidY[Math.floor(Math.random()*4)],S4().substring(1),"-",S4(),S4(),S4()].join("") }


// main

var clientDb = {}

onconnect = function(e) {

	// capture port
	var port = e.ports[0]
	port.onmessage = onmessage

	// port is a new pipe; build pipe.
	var pipe = uuid()
	port._pipe = pipe // pipe id
	port._rseq = 1
	port._seq = 1
	port._seqTicket = 1
	port._deferred = []
	port._rdeferred = []
	port._in_flight = false
	clientDb[pipe] = port
}

var onmessage = function(e) {

	var port = e.target
	var req = e.data

	var xhr = new XMLHttpRequest()
	xhr.open(req.method, req.url, true, req["user"], req["password"])

	// set imported headers
	for(var h in req.headers)
		xhr.setRequestHeader(h, req.headers[h])
	// add x-pipe and x-seq headers 
	if(port._seqTicket != 1) {
		xhr.setRequestHeader("X-Pipe", port._pipe)
		xhr.setRequestHeader("X-Seq", port._seqTicket++)
	} else
		xhr.setRequestHeader("X-Create-Pipe", port._pipe)

	// used only if server doesnt end up supporting x-pipe
	// otherwise, we look up the clientDb from the x-pipe
	xhr._port = port
	
	xhr.onreadystatechange = xhrHandler
	xhr.send(req["data"])
}

var headerValueChomp = /^:\s*(\w.*?)\s*\r?$/m
var xhrHandler = function(e,h) {

	// require at least headers to progress
	if(this.readyState < 2)
		return


	// prepare a msg to send for with this new data
	var msg = this._message
	// are we the continuation of another deferred message?
	var continuation = msg !== undefined 
	// we're not, so we need a message.
	if(!continuation)
		msg = {}
	// we think we are, but that message has already been flagged as sent.
	if(msg._sent) {
		continuation = false
		msg = this._message = {}
	}


	// load headers
	var headers = this._headers
	if(headers == undefined) {

		// parse headers
		headers = {}
		var headerText = this.getAllResponseHeaders()
		var headerRows = headerText.split("\n")
		for(var rowIndex in headerRows) {

			var row = headerRows[rowIndex]
			var headerKey = row.split(":",1)[0]
			if(headerKey.length >= row.length)
				continue
			// get everything after the header key
			var headerValue = row.substr(headerKey.length)

			// clean headerValue, remove whitespacing
			headerValue = headerValueChomp.exec(headerValue)[1]

			// attach to existing header
			if(headers[headerKey] != undefined)
				headerValue = headers[headerKey]+","+headerValue

			// write complete header line to headers
			headers[headerKey] = headerValue
		}

		// install headers
		this._headers = headers
	}


	// lookup pipe

	// do we already know our pipe?
	var pipe = this._pipe

	// look in header for pipe	
	if(pipe === undefined) {

		pipe = headers["X-Pipe"] || headers["x-pipe"]
	}

 	// look in header for _new_ pipe
	if(pipe === undefined) {

		// ok this is a really weird context-- the server is asking to create its own pipe to us.
		pipe = headers["X-Create-Pipe"] || headers["x-create-pipe"]

		// need to set up a router & global event dispatcher to figure out who (which pages) gets to talk to the new pipe

		// create a clientDb[pipe] entry to handle
		// this ought be another rhttp gateway
	}

	// fallback -- dont have pipe yet; non- pipelined server, reply to original request
	if(pipe === undefined) {

		pipe = this._port._pipe
		msg.nonPipeLayer = true
	}

	// error case; pipe not found?! should at least be able to reply as per fallback!
	if(pipe === undefined) {

		throw "pipe not found"
	}

	// assign pipe on message if we've found it just now
	if(this._pipe === undefined) {
		msg.pipe = pipe
		this._pipe = pipe
	}


	// lookup port
	var port = clientDb[pipe]


	// initial XHR handle call, load basic datums
	var seq = headers["X-Seq"] || headers["x-seq"], 
		rseq = headers["X-RSeq"] || headers["x-rseq"]
	if(this.readyState == 2 || this._headersSent == undefined) {

		// load status
		msg.status = this.status
		msg.statusText = this.statusText

		// load sequence
		msg.seq = Number(seq) || seq
		msg.rseq = Number(rseq) || rseq

		// load headers
		msg.headers = headers

		// headers are queued to send
		this._headersSent = true
	}

	// load state
	msg.readyState = this.readyState // 3 may be around for a while

	// read in body content for seq
	if(seq) {
		var bodyLen = this._bodyLen || 0
		msg.responseDelta = this.responseText.substr(bodyLen)
	}

	// final stage
	if(this.readyState == 4) {

		// load responseXML
		try {
			var x = this.responseXML
			if(x)
				msg.responseXML = x
		} catch (err) {}

		if(rseq)
			msg.responseDelta = this.responseText
	}

	
	// check whether this message is fresh, or should defer
	var fresh = false
	if(seq == port._seq) 
		fresh = true
	else if(rseq = port._rseq && !port._in_flight && msg.readyState == 4)
		fresh = true
	var any_fresh = fresh == true

	// we're about to send this message, so update how far along we are sending the responseText's contents
	if(seq && fresh)
		this._bodyLen = this.responseText.length

	// while fresh, despool, check if next is fresh
	while(fresh) {

		var uname = rseq ? "_rseq" : "_seq"

		// send
		port.postMessage(msg)
		// tombstone; make sure no one tries to resend this message
		msg._sent = true

		// message has been sent, assume nothing more to send
		fresh = false

		// is this xhr-message in its final state, nothing more to send?
		var final = msg.readyState == 4
		port._in_flight = !final
		if(final) {
			
			// go to next message
			++port[uname]

			// check rdeferred's top to see if its ready to send
			if(port._rdeferred.length && port._rdeferred[0].rseq == port._rseq && port._rdeferred[0].readyState == 4) {
				
				fresh = true
				msg = port._rdeferred.shift()
				
			}
			// check deferred's top to see if it is the next message
			else if(port._deferred.length && port._deferred[0].seq == port._seq) {

				// deferred is next!  aka fresh!
				fresh = true
				// load in message for send
				msg = port._deferred.shift()
			}
		}
	}
	if(!continuation && !any_fresh) {

		var compare = rseq ? function(a,b) { return a.rseq - b.rseq } : function(a,b) { return a.seq - b.seq }, 
			deferred = rseq ? port._rdeferred : port._deferred

		// havent already queued/deferred a message, and we're further down the queue
		orderedInsert(deferred, msg, compare)
		// since we're deferring, build any future xhr state upon this existing message
		this._message = msg
	} 
	// otherwise, we've been building a message and its queued to send.  we've updated state, so we're done.
}
