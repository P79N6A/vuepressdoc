# gitbook的基本使用
分享者：杨彦星

----

我们使用 gitbook 来生成文档，使用 markdown 来写文档，通过git来管理版本并且发布,基本的思路是markdown 写文档，gitbook生成网站目录，git提交发布.

# 一、写之前的准备

## 1. 将自己的ssh公钥添加到16.17上的git用户中
大家应该有16.17上的用户权限了吧，如果没有的话先在[智鹰](http://zhiying.qihoo.net:8360/katrina/index.php/AccountRequest/index?workflow_id=12)上申请，或者将公钥发给我(杨彦星)

使用你们的远程账号登录16.17，切换root
```shell
sudo su 
# 输入分配你的密码，注意这里不是域密码
vim /home/git/.ssh/authorized_keys
# 将你的公钥填写进去，注意是单起一行
```

## 2. 本地安装git nodejs

安装git 与nodejs 网上查一下，就不多写了
设置淘宝cnpm镜像

`npm install -g cnpm --registry=https://registry.npm.taobao.org`

安装gitbook 

`cnpm install gitbook-cli -g`

## 3. clone 项目

执行`git clone git@10.16.16.17:qadevdoc.git`

## 4. 安装 gitbook 插件

如果是首次 clone 项目，进入`qadevdoc` 目录，执行 `gitbook install ./ ` 命令来安装插件，以后就不用了，除非有设置新的插件。

# 二、开始编写

## 1. 已经在SUMMARY.md中的文档

我已经根据周会内容生成了一些文档，大家可以在我生成的文档上写，查看 `SUMMARY.md` 或者[文档首页](http://10.16.16.17:8080/),用张晓芬的负载均衡举例

![](/image/doc/doc.png)

如果要写nginx的，则文档所在的位置是 `loadbalancing/lvs.md` ,则打开该文档，按照[markdown](/doc/markdown.html)的语法进行编写.

## 2. 没有在SUMMARY.md中的文档

自己也可以根据自己的内容添加文档，先在`SUMMARY.md` 按照已有的格式进行添加，添加完以后，在项目的根目录中执行 `gitbook init ` 命令来初始化，gitbook 会根据`SUMMARY.md`中的设定来生成对应的文档，之后再对该文档进行编辑。

## 3. 实时预览

gitbook 提供实时预览功能，在项目的根路径上执行 `gitbook serve` 会开启本机的4000端口，可以通过 http://127.0.0.1:4000 来进行预览，在你编写文档的时候，当你保存文件以后，gitbook会自动重新生成html，浏览器会自动刷新。

## 4. 添加图片

可以通过markdown语法添加外网的图片，也可以添加本地图片，将图片放到image目录下，最好建立相应的文件夹，这样看起来不会太乱，然后通过

```
![](/image/doc/doc.png)
```

这种方式来引用图片。

## 5. 编辑一下首页README.md 文件，将本文的连接添加进去。

# 发布文档

## 1. 生成html 

在项目根目录下执行`gitbook build ` 命令生成网站文件，新的网站文件在生成在 `_book` 目录中，注意，**如果要发布网站，一定在先执行gitbook build 命令**，否则你上传的是临时的文件，会有一个js在不停的卡顿。

## 2. 使用git上传

基本的命令 

```shell
git add . # 将所有修改添加到缓存区
git commit -m "some commit" # 添加commit
git push # 推送到远端服务器
```


注意 **之后再写文档之前一定要先执行git pull 拉取一个远端的更新**


