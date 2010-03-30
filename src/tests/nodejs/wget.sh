#!/bin/sh
URL=http://localhost:8765/pipe
wget --header='X-Create-Pipe: 1' --header='cookie: a1' ${URL}/resource.txt -O 1 &
sleep 1
wget --header='X-Pipe: 1' --header='cookie: a1' --header='X-Seq: 2' ${URL}/resource.txt?delay=8 -O 2 &
sleep 1
wget --header='X-Pipe: 1' --header='cookie: a1' --header='X-Seq: 3' ${URL}/resource2.txt -O 3 &
