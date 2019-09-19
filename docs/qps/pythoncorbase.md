# python协程基础

之前的一篇文章[python中的asyncio使用详解](/qps/asynciobase.html)介绍了在python3 中的asyncio的基础使用，可是在实际的工作中，由于以前写了太多的多线程与多进程，所以对于以前编写风格和一些由于没有异步支持的库函数来说，由于要写在异步里，所以对于编写代码来说还是要处理很多同步的方法，今天在这里整理一下在异步操作中如果处理同步的函数问题。


为了更好的演示，我准备了三个函数，一个同步的函数，两个异步的函数
```python
# 定义阻塞的函数
def ping(url):
    print("阻塞函数开始运行")
    time.sleep(2)
    os.system("ping %s"%url)
    print("阻塞函数运行结束")
    
# 定义两个异步函数
async def asyncfunc1():
    print("Suspending func1")
    await asyncio.sleep(1)
    print("func func1 ", threading.current_thread())
    print('Resuming func1')
    return "func1"
    
async def asyncfunc2():
    print("Suspending func2")
    await asyncio.sleep(1)
    print("func func2 ", threading.current_thread())
    print('Resuming func2')
    return "func2"
```
# 协程中控制任务

## 单个协程任务的运行

上面的函数，比如说我只想将asyncfunc1() 函数运行并且得结果，可以使用`loop.create_task()`方法创建一个task对象，task是Futures的子类，当调用`loop.run_until_complete()` 以后，协程跑完以后，通过`task.result()`获取协程函数的返回结果。
```python
async def asyncfunc1():
    print("Suspending func1")
    await asyncio.sleep(1)
    print("func func1 ", threading.current_thread())
    print('Resuming func1')
    return "func1"

if __name__=="__main__":
    print("In main thread ",threading.current_thread())
    loop = asyncio.get_event_loop()
    task = loop.create_task(asyncfunc1())
    loop.run_until_complete(task)
    print("task result is ",task.result())
```

输出结果为
```
In main thread  <_MainThread(MainThread, started 6140)>
Suspending func1
func func1  <_MainThread(MainThread, started 6140)>
Resuming func1
task result is  func1
```

主线程和跑的协程函数是在同一个线程中。

也可以给task对象添加一个回调方法
```python
#coding:gbk
import asyncio
import time,sys


async def asyncfunc1():
    print("Suspending func1")
    await asyncio.sleep(1)
    print("func func1 ", threading.current_thread())
    print('Resuming func1')
    return "func1"
    
# 定义一个回调函数
def callbackfunc(task):
    print("task 运行结束,它的结果是:",task.result())
    
    
if __name__=="__main__":
    print("In main thread ",threading.current_thread())
    loop = asyncio.get_event_loop()
    task = loop.create_task(asyncfunc1())
    task.add_done_callback(callbackfunc)
    loop.run_until_complete(task)

```

输出结果为
```
In main thread  <_MainThread(MainThread, started 11248)>
Suspending func1
func func1  <_MainThread(MainThread, started 11248)>
Resuming func1
task 运行结束,它的结果是: func1
```

`loop.run_until_complete` 是一个阻塞方法，只有当它里面的协程运行结束以后这个方法才结束，才会运行之后的代码。

其实也可以不调用`loop.run_until_complete`方法，创建一个task以后，其实就已经在跑协程函数了，只不过当事件循环如果准备开始运行了，此时的task状态是`pending`,如果不调用事件循环的话，则不会运行协程函数，由于主线程跑完了，子线程也就被销毁了，如代码写成这样：
```python
if __name__=="__main__":
    print("In main thread ",threading.current_thread())
    loop = asyncio.get_event_loop()
    task = loop.create_task(asyncfunc1())
    time.sleep(3)
```
得到的输出是
```
In main thread  <_MainThread(MainThread, started 6056)>
Task was destroyed but it is pending!
task: <Task pending coro=<asyncfunc1() running at test.py:18> cb=[callbackfunc() at test.py:39]>
sys:1: RuntimeWarning: coroutine 'asyncfunc1' was never awaited

```

所以想要使得协程函数得到执行，需要调用事件循环来执行任务，上面的`loop.run_until_complete`就是使循环开始跑了，其实也可以使用`loop.run_forever()`,这个函数就像它的名字一样，会一直跑。只有事件循环跑起来了，那么使用该循环注册的协程才会得到执行，但是如果使用`loop.run_forever()`则会阻塞在这里，事件循环还有一个`stop`方法，可以结束循环，我们可以在task对象上添加一个回调方法，当协程执行结束以后，调用事件循环的`stop`方法来结束整个循环

```python
#coding:gbk
import asyncio
import time,sys

async def asyncfunc1():
    print("Suspending func1")
    await asyncio.sleep(1)
    print("func func1 ", threading.current_thread())
    print('Resuming func1')
    return "func1"
    
# 定义一个回调函数
def callbackfunc(task):
    print("task 运行结束,它的结果是:",task.result())
    loop.stop()
    
    
if __name__=="__main__":
    print("In main thread ",threading.current_thread())
    loop = asyncio.get_event_loop()
    task = loop.create_task(asyncfunc1())
    task.add_done_callback(callbackfunc)
    loop.run_forever()

```


除了使用`loop.run_until_complete`方法，还可以使用`asyncio.ensure_future()` 方法来运行协程，将上面代码中的`task = loop.create_task(asyncfunc1())` 改为 `task = asyncio.ensure_future(asyncfunc1())`会得到相同的结果,它的参数是协程对象或者futures，也可以传task对象，因为task是futures的子类,当传入的是一个协程对象时，返回一个task对象，传入一个futures的时候，直接返回futures对象,也就是说，在调用`asyncio.ensure_future()`以后，都会返回一个task对象,都可以为它添加一个回调方法，并且可以调用task.result()方法得到结果(注意如果task没有执行结束就调用result方法，则会抛异常)。

## 多个协程任务的并行

最上面我准备了两个异步的函数asyncfunc1和asyncfunc2，如果我想要这两个函数同时执行，并且得到它们的返回值该怎么操作呢？
有了上面单协程的经验，我们也可以使用事件循环创建两个task,然后在run_forever()来执行，可以对task添加回调，将结果输出。
```python
#coding:gbk
import asyncio

# 定义两个异步函数
async def asyncfunc1():
    print("Suspending func1")
    await asyncio.sleep(1)
    print("func func1 ", threading.current_thread())
    print('Resuming func1')
    return "func1"
    
async def asyncfunc2():
    print("Suspending func2")
    await asyncio.sleep(1)
    print("func func2 ", threading.current_thread())
    print('Resuming func2')
    return "func2"

    
# 定义一个回调函数
def callbackfunc(task):
    print("task 运行结束,它的结果是:",task.result())
    
    
if __name__=="__main__":
    print("In main thread ",threading.current_thread())
    loop = asyncio.get_event_loop()
    task1 = loop.create_task(asyncfunc1())
    task1.add_done_callback(callbackfunc)
    task2 = loop.create_task(asyncfunc2())
    task2.add_done_callback(callbackfunc)
    loop.run_forever()
```
输出结果是
```
In main thread  <_MainThread(MainThread, started 8040)>
Suspending func1
Suspending func2
func func1  <_MainThread(MainThread, started 8040)>
Resuming func1
func func2  <_MainThread(MainThread, started 8040)>
Resuming func2
task 运行结束,它的结果是: func1
task 运行结束,它的结果是: func2
```

此时由于loop调用了run_forever方法，且没有方法调用stop方法，所以程序会一直卡着。

这样是可以将多个协程跑起来，但这样的处理一是繁琐，二是不方便结果的回收。

asyncio有一个gather方法，可以传入多个任务对象，当调用await asyncio.gather(*) 时，它会将结果全部返回

由于await 只能写在async def 函数中，所以这里还需要新创建一个函数
```python
async def main():
    task1 = loop.create_task(asyncfunc1())
    task1.add_done_callback(callbackfunc)
    task2 = loop.create_task(asyncfunc2())
    task2.add_done_callback(callbackfunc)
    result = await asyncio.gather(task1,task2)    
    print(result)
    
async def mian2():
    result = await asyncio.gather(asyncfunc1(),asyncfunc2())
    print(result)
```

两种定义方式都可以，一个是向gather函数传的是协程对象，一个是传的task对象。之后在调用
```python
if __name__=="__main__":
    print("In main thread ",threading.current_thread())
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main()) # or main2()
```

得到的输出为
```
In main thread  <_MainThread(MainThread, started 7016)>
Suspending func1
Suspending func2
func func1  <_MainThread(MainThread, started 7016)>
Resuming func1
func func2  <_MainThread(MainThread, started 7016)>
Resuming func2
task 运行结束,它的结果是: func1
task 运行结束,它的结果是: func2
['func1', 'func2']
```

这样就达到的协程的并行与结果的回收。

## 使用传统的多线程的方式跑同步代码
```python
#coding:gbk
import asyncio
import time,sys
import threading
import concurrent
import functools
import subprocess
import os

# 定义阻塞的函数
def ping(url):
    print("阻塞函数开始运行,当前的线程ID为:",threading.current_thread())
    time.sleep(2)
    os.system("ping %s"%url)
    print("阻塞函数运行结束")
    
    
async def main():
    task1 = loop.create_task(asyncfunc1())
    task1.add_done_callback(callbackfunc)
    task2 = loop.create_task(asyncfunc2())
    task2.add_done_callback(callbackfunc)
    result = await asyncio.gather(task1,task2)    
    print(result)
    
async def mian2():
    result = await asyncio.gather(asyncfunc1(),asyncfunc2())
    print(result)
    
if __name__=="__main__":
    print("In main thread ",threading.current_thread())
    # 创建三个子线程
    t1 = threading.Thread(target=ping,args=("www.baidu.com",))
    t2 = threading.Thread(target=ping,args=("www.yangyanxing.com",))
    t3 = threading.Thread(target=ping,args=("www.qq.com",))
    t1.start()
    t2.start()
    t3.start()
```

输出结果
```
In main thread  <_MainThread(MainThread, started 9208)>
阻塞函数开始运行,当前的线程ID为: <Thread(Thread-1, started 8720)>
阻塞函数开始运行,当前的线程ID为: <Thread(Thread-2, started 9368)>
阻塞函数开始运行,当前的线程ID为: <Thread(Thread-3, started 8320)>

正在 Ping https.qq.com [123.151.137.18] 具有 32 字节的数据:
来自 123.151.137.18 的回复: 字节=32 时间=4ms TTL=53

正在 Ping www.a.shifen.com [220.181.38.150] 具有 32 字节的数据:
来自 220.181.38.150 的回复: 字节=32 时间=1ms TTL=54

正在 Ping yangyanxing.coding.me [119.28.76.36] 具有 32 字节的数据:
....
....
阻塞函数运行结束
```

可以看到，主线程和子线程跑在了不同的线程中。

## 在事件循环中动态的添加同步函数
解决方案是，先启一个子线程，这个线程用来跑事件循环loop，然后动态的将同步函数添加到事件循环中
```python
#coding:gbk
import asyncio
import time,sys
import threading
import concurrent
import functools
import subprocess
import os

# 定义阻塞的函数
print("阻塞函数开始运行,当前的线程ID为:",threading.current_thread())
    time.sleep(2)
    print("模拟ping 输出 ",url)
    print("阻塞函数运行结束,当前的线程ID为:",threading.current_thread())  

#定义一个跑事件循环的线程函数    
def start_thread_loop(loop):
    asyncio.set_event_loop(loop)
    loop.run_forever()
    
if __name__=="__main__":
    print("In main thread ",threading.current_thread())
    loop = asyncio.get_event_loop()
    # 在子线程中运行事件循环,让它run_forever
    t = threading.Thread(target= start_thread_loop, args=(loop,))
    t.start()
    
    # 在主线程中动态添加同步函数
    loop.call_soon_threadsafe(ping,"www.baidu.com")
    loop.call_soon_threadsafe(ping,"www.qq.com")
    loop.call_soon_threadsafe(ping,"www.yangyanxing.com")
    print('主线程不会阻塞')

```
由于使用ping 命令得到很多输出，所以我对函数稍稍做了修改,只是模拟打印了一行文字，但是函数中的time.sleep(2) 这个是一个阻塞式的函数
得到的输出为
```
In main thread  <_MainThread(MainThread, started 7924)>
阻塞函数开始运行,当前的线程ID为: <Thread(Thread-1, started 10716)>
主线程不会阻塞
模拟ping 输出  www.baidu.com
阻塞函数运行结束,当前的线程ID为: <Thread(Thread-1, started 10716)>
阻塞函数开始运行,当前的线程ID为: <Thread(Thread-1, started 10716)>
模拟ping 输出  www.qq.com
阻塞函数运行结束,当前的线程ID为: <Thread(Thread-1, started 10716)>
阻塞函数开始运行,当前的线程ID为: <Thread(Thread-1, started 10716)>
模拟ping 输出  www.yangyanxing.com
阻塞函数运行结束,当前的线程ID为: <Thread(Thread-1, started 10716)>
```
从输出结果可以看出，`loop.call_soon_threadsafe()`和主线程是跑在同一个线程中的，虽然`loop.call_soon_threadsafe()`没有阻塞主线程的运行，但是由于需要跑的函数ping是阻塞式函数，所以调用了三次，这三次结果是顺序执行的，并没有实现并发。
如果想要实现并发，需要通过`run_in_executor` 把同步函数在一个执行器里去执行。该方法需要传入三个参数，`run_in_executor(self, executor, func, *args)` 第一个是执行器，默认可以传入None，如果传入的是None，将使用默认的执行器，一般执行器可以使用线程或者进程执行器。

```python
#coding:gbk
import asyncio
import time,sys
import threading
import concurrent
import functools
import subprocess
import os

# 定义阻塞的函数
def ping(url):
    print("阻塞函数开始运行,当前的线程ID为:",threading.current_thread())
    time.sleep(2)
    print("模拟ping 输出 ",url)
    print("阻塞函数运行结束,当前的线程ID为:",threading.current_thread())
    

#定义一个跑事件循环的线程函数    
def start_thread_loop(loop):
    asyncio.set_event_loop(loop)
    loop.run_forever()
    
if __name__=="__main__":
    print("In main thread ",threading.current_thread())
    loop = asyncio.get_event_loop()
    # 在子线程中运行事件循环,让它run_forever
    t = threading.Thread(target= start_thread_loop, args=(loop,))
    t.start()
    
    # 在主线程中动态添加同步函数
    loop.run_in_executor(None,ping,"www.baidu.com")
    loop.run_in_executor(None,ping,"www.qq.com")
    loop.run_in_executor(None,ping,"www.yangyanxing.com")
    print('主线程不会阻塞')
```

得到的输出结果
```
In main thread  <_MainThread(MainThread, started 8588)>
阻塞函数开始运行,当前的线程ID为: <Thread(Thread-2, started daemon 9068)>
阻塞函数开始运行,当前的线程ID为: <Thread(Thread-3, started daemon 7200)>
阻塞函数开始运行,当前的线程ID为: <Thread(Thread-4, started daemon 10924)>
主线程不会阻塞
模拟ping 输出  www.yangyanxing.com
模拟ping 输出  www.baidu.com
阻塞函数运行结束,当前的线程ID为: <Thread(Thread-4, started daemon 10924)>
阻塞函数运行结束,当前的线程ID为: <Thread(Thread-2, started daemon 9068)>
模拟ping 输出  www.qq.com
阻塞函数运行结束,当前的线程ID为: <Thread(Thread-3, started daemon 7200)>
```
可以看到同步函数实现了并发，但是它们跑在了不同的线程中，这个就和之前传统的使用多线程是一样的了。

上文说到，run_in_executor的第一个参数是执行器，这里执行器是使用`concurrent.futures` 下的两个类，一个是thread一个是process，也就是执行器可以分为线程执行器和进程执行器。它们在初始化的时候都有一个`max_workers`参数，如果不传则根据系统自身决定。

```python
#coding:gbk
import asyncio
import time,sys
import threading
import concurrent
import functools
import subprocess
import os

# 定义阻塞的函数
def ping(url):
    print("阻塞函数开始运行,当前的线程ID为:",threading.current_thread(),"进程ID为:",os.getpid())
    time.sleep(2)
    print("模拟ping 输出 ",url)
    print("阻塞函数运行结束,当前的线程ID为:",threading.current_thread())
    

#定义一个跑事件循环的线程函数    
def start_thread_loop(loop):
    asyncio.set_event_loop(loop)
    loop.run_forever()
    
if __name__=="__main__":
    print("In main thread ",threading.current_thread())
    loop = asyncio.get_event_loop()
    # 在子线程中运行事件循环,让它run_forever
    t = threading.Thread(target= start_thread_loop, args=(loop,))
    t.start()
    threadingexecutor = concurrent.futures.ThreadPoolExecutor(2)
    processExetutor = concurrent.futures.ProcessPoolExecutor()
    
    # 在主线程中动态添加同步函数
    loop.run_in_executor(processExetutor,ping,"www.baidu.com")
    loop.run_in_executor(processExetutor,ping,"www.qq.com")
    loop.run_in_executor(processExetutor,ping,"www.yangyanxing.com")
    print('主线程不会阻塞')
```

这里初始化了两个执行器，一个是线程的，一个是进程的，
它们执行的效果一样，只是一个跑在了多线程，一个跑在了多进程
使用`concurrent.futures.ThreadPoolExecutor()`执行器的结果是
```
In main thread  <_MainThread(MainThread, started 7688)>
阻塞函数开始运行,当前的线程ID为: <Thread(Thread-2, started daemon 10924)> 进程ID为: 8188
阻塞函数开始运行,当前的线程ID为: <Thread(Thread-3, started daemon 9068)> 进程ID为: 8188
主线程不会阻塞
模拟ping 输出  www.baidu.com
模拟ping 输出  www.qq.com
阻塞函数运行结束,当前的线程ID为: <Thread(Thread-2, started daemon 10924)>
阻塞函数运行结束,当前的线程ID为: <Thread(Thread-3, started daemon 9068)>
阻塞函数开始运行,当前的线程ID为: <Thread(Thread-2, started daemon 10924)> 进程ID为: 8188
模拟ping 输出  www.yangyanxing.com
阻塞函数运行结束,当前的线程ID为: <Thread(Thread-2, started daemon 10924)>
```

这们的进程ID都是8188，是跑在了同一个进程下。另外注意一下，我这里在初始化的时候传一个max_workers为2，注意看结果的输出，它是先执行了前两个，当有一个执行完了以后再开始执行第三个，而不是三个同时运行的。

使用`concurrent.futures.ProcessPoolExecutor()`执行器的执行结果
```
In main thread  <_MainThread(MainThread, started 10220)>
主线程不会阻塞
阻塞函数开始运行,当前的线程ID为: <_MainThread(MainThread, started 3928)> 进程ID为: 6652
阻塞函数开始运行,当前的线程ID为: <_MainThread(MainThread, started 10992)> 进程ID为: 9436
阻塞函数开始运行,当前的线程ID为: <_MainThread(MainThread, started 9740)> 进程ID为: 9000
模拟ping 输出  www.qq.com
阻塞函数运行结束,当前的线程ID为: <_MainThread(MainThread, started 3928)>
模拟ping 输出  www.baidu.com
阻塞函数运行结束,当前的线程ID为: <_MainThread(MainThread, started 10992)>
模拟ping 输出  www.yangyanxing.com
阻塞函数运行结束,当前的线程ID为: <_MainThread(MainThread, started 9740)>
```
可以看出来它们的进程ID是不同的。

这样看使用`run_in_executor`和使用多进程和多线程其实意义是一样的。别着急，在讲完异步函数以后就可以看到区别了。

## 在事件循环中动态的添加异步函数

通过`asyncio.run_coroutine_threadsafe` 方法来动态的将一个协程绑定到事件循环上，并且不会阻塞主线程
```python
#coding:gbk
import asyncio
import time,sys
import threading
import concurrent
import functools
import subprocess
import os

# 定义两个异步函数
async def asyncfunc1():
    print("Suspending func1")
    await asyncio.sleep(1)
    print("func func1 ", threading.current_thread())
    print('Resuming func1')
    return "func1"
    
async def asyncfunc2():
    print("Suspending func2")
    await asyncio.sleep(1)
    print("func func2 ", threading.current_thread())
    print('Resuming func2')
    return "func2"
    

#定义一个跑事件循环的线程函数    
def start_thread_loop(loop):
    asyncio.set_event_loop(loop)
    loop.run_forever()
    
if __name__=="__main__":
    print("In main thread ",threading.current_thread())
    loop = asyncio.get_event_loop()
    # 在子线程中运行事件循环,让它run_forever
    t = threading.Thread(target= start_thread_loop, args=(loop,))
    t.start()
    asyncio.run_coroutine_threadsafe(asyncfunc1(),loop)
    asyncio.run_coroutine_threadsafe(asyncfunc1(),loop)
    asyncio.run_coroutine_threadsafe(asyncfunc2(),loop)
    asyncio.run_coroutine_threadsafe(asyncfunc2(),loop)
    
    print('主线程不会阻塞')
```
通过`asyncio.run_coroutine_threadsafe`在loop上绑定了四个协程函数，得到的输出结果为
```
In main thread  <_MainThread(MainThread, started 4772)>
Suspending func1
主线程不会阻塞
Suspending func1
Suspending func2
Suspending func2
func func1  <Thread(Thread-1, started 3948)>
Resuming func1
func func2  <Thread(Thread-1, started 3948)>
Resuming func2
func func1  <Thread(Thread-1, started 3948)>
Resuming func1
func func2  <Thread(Thread-1, started 3948)>
Resuming func2
```
主线程不会被阻塞，起的四个协程函数几乎同时返回的结果，但是注意，协程所在的线程和主线程不是同一个线程，因为此时事件循环loop是放到了另外的子线程中跑的，所以此时这四个协程放到事件循环的线程中运行的。
注意这里只有`run_coroutine_threadsafe`方法，没有`run_coroutine_thread` 方法。

## 获取协程的返回结果
获取结果可以使用`asyncio.gather()`方法,这里面传的是`coros_or_futures`就是协程或者task对象，`asyncio.run_coroutine_threadsafe()`和`run_in_executor()`返回的都是Future对象,所以可以将它们共同放到gather里,获取返回值.

```python
#coding:gbk
import asyncio
import time,sys
import threading
import concurrent
import functools
import subprocess
import os

# 定义阻塞的函数
def ping(url):
    print("阻塞函数开始运行,当前的线程ID为:",threading.current_thread(),"进程ID为:",os.getpid())
    time.sleep(4)
    print("模拟ping 输出 ",url)
    print("阻塞函数运行结束,当前的线程ID为:",threading.current_thread())
    return url
    
# 定义两个异步函数
async def asyncfunc1():
    print("Suspending func1")
    await asyncio.sleep(1)
    print("func func1 ", threading.current_thread())
    print('Resuming func1')
    return "func1"
    
async def asyncfunc2():
    print("Suspending func2")
    await asyncio.sleep(2)
    print("func func2 ", threading.current_thread())
    print('Resuming func2')
    return "func2"
    

#定义一个跑事件循环的线程函数    
def start_thread_loop(loop):
    print("loop线程 id 为",threading.current_thread())
    asyncio.set_event_loop(loop)
    loop.run_forever()
    
# 定义一个回调函数
def callbackfunc(task):
    print("task 运行结束,它的结果是:",task.result())
    # loop.stop()
    
async def main():
    t1 = time.time()
    # 使用loop.create_task创建task对象,返回asyncio.tasks.Task对象
    task1 = loop.create_task(asyncfunc1())
    task2 = loop.create_task(asyncfunc2())
    # 使用asyncio.run_coroutine_threadsafe 返回的是concurrent.futures._base.Future对象
    # 注意这个对象没有__await__方法，所以不能对其使用await 但是可以给它添加回调add_done_callback
    task3 = asyncio.run_coroutine_threadsafe(asyncfunc1(),loop)
    task4 = asyncio.run_coroutine_threadsafe(asyncfunc2(),loop)
    
    # 使用loop.run_in_executor创建阻塞的任务，返回asyncio.futures.Future对象
    task5 = loop.run_in_executor(None,ping,"www.baidu.com")
    task6 = loop.run_in_executor(None,ping,"www.yangyanxing.com")
    
    # 使用asyncio.ensure_future()创建任务对象
    task7 = asyncio.ensure_future(asyncfunc1())
    task8 = asyncio.ensure_future(asyncfunc2())
    
    
    task1.add_done_callback(callbackfunc)    
    task2.add_done_callback(callbackfunc)    
    task3.add_done_callback(callbackfunc)
    task4.add_done_callback(callbackfunc)
    task5.add_done_callback(callbackfunc)
    task6.add_done_callback(callbackfunc)
    task7.add_done_callback(callbackfunc)
    task8.add_done_callback(callbackfunc)
   
    result = await asyncio.gather(task1,task2,task5,task6,task7,task8)    
    print(result)
    t2 = time.time()
    print("一共用了%s时间"%(t2-t1))
    
async def mian2():
    result = await asyncio.gather(asyncfunc1(),asyncfunc2(),)
    print(result)
    
def shutdown(loop):
    loop.stop()
    
if __name__=="__main__":
    print("In main thread ",threading.current_thread())
    loop = asyncio.get_event_loop()
    loop2 = asyncio.new_event_loop()
    # 在子线程中运行事件循环,让它run_forever
    t = threading.Thread(target= start_thread_loop, args=(loop,))
    t.start()
    asyncio.run_coroutine_threadsafe(main(),loop)
    
    print('主线程不会阻塞')
```

代码执行结果:
```
In main thread  <_MainThread(MainThread, started 6052)>
loop线程 id 为 <Thread(Thread-1, started 2388)>
主线程不会阻塞
阻塞函数开始运行,当前的线程ID为: <Thread(Thread-2, started daemon 11644)> 进程ID为: 12280
阻塞函数开始运行,当前的线程ID为: <Thread(Thread-3, started daemon 1180)> 进程ID为: 12280
Suspending func1
Suspending func2
Suspending func1
Suspending func2
Suspending func1
Suspending func2
func func1  <Thread(Thread-1, started 2388)>
Resuming func1
func func1  <Thread(Thread-1, started 2388)>
Resuming func1
func func1  <Thread(Thread-1, started 2388)>
Resuming func1
task 运行结束,它的结果是: func1
task 运行结束,它的结果是: func1
task 运行结束,它的结果是: func1
func func2  <Thread(Thread-1, started 2388)>
Resuming func2
func func2  <Thread(Thread-1, started 2388)>
Resuming func2
func func2  <Thread(Thread-1, started 2388)>
Resuming func2
task 运行结束,它的结果是: func2
task 运行结束,它的结果是: func2
task 运行结束,它的结果是: func2
模拟ping 输出  www.baidu.com
阻塞函数运行结束,当前的线程ID为: <Thread(Thread-2, started daemon 11644)>
模拟ping 输出  www.yangyanxing.com
阻塞函数运行结束,当前的线程ID为: <Thread(Thread-3, started daemon 1180)>
task 运行结束,它的结果是: www.baidu.com
task 运行结束,它的结果是: www.yangyanxing.com
['func1', 'func2', 'www.baidu.com', 'www.yangyanxing.com', 'func1', 'func2']
一共用了4.002800464630127时间
```


总的时间是取决于所有运行的函数中耗时最长的,这里同步函数有个阻塞的sleep(4) ,所以总的时间是4秒多一点点.

