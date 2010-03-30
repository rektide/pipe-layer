var tests = [
	 ['GET','/pipe/resource.txt',{'X-Create-Pipe': 1, 'cookie': 'a1'},0]
	,['GET','/pipe/resource.txt',{'X-Pipe': 1, 'X-Seq': 2, 'cookie': 'a1'},1]
]

runHtmlTests(tests)

