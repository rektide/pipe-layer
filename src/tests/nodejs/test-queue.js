//var pipe = S4()+S4()
var pipe = 1

var tests = [
	 ['GET','/pipe/resource.txt',{'X-Create-Pipe': pipe, 'cookie': 'a1'},0]
	,['GET','/pipe/resource.txt?delay=4',{'X-Pipe': pipe, 'X-Seq': 2, 'cookie': 'a1'},1]
	,['GET','/pipe/resource2.txt',{'X-Pipe': pipe, 'X-Seq': 3, 'cookie': 'a1'},2]
]

runHtmlTests(tests,null,{pipe:pipe})
