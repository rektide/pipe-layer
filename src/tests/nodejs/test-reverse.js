var tests = [
	 ['GET','/pipe/resource.txt',{'X-Create-Pipe': 1, 'cookie': 'a1'},0]
	,['GET','/pipe/resource.txt?delay=7',{'X-Pipe': 1, 'X-Seq': 3, 'cookie': 'a1'},1]
	,['GET','/pipe/resource2.txt',{'X-Pipe': 1, 'X-Seq': 2, 'cookie': 'a1'},2]
]

runHtmlTests(tests)

