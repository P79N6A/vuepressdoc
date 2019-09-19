# 本文档的构建

分享者:杨彦星

----

本文档使用gitbook构建，通过git在10.16.16.17上使用git服务来进行管理，使用nginx来作为服务端。以下记录该网站的构建过程，以后用来搭建类似网站与可以作为参考。

# 一、在17上搭建git服务

## 1.1 安装git服务
1. 安装

    ```shell
        yum install git
    ```
2. 验证
    ```
    [yangyanxing@test17 ~]$ git --version
    git version 1.8.3.1
    ```
3. 配置基本信息(不提交可以不做)
   ```shell
    //配置基本信息
    [root@localhost ~]# git config --global user.name "qadev"
    [root@localhost ~]# git config --global user.email g-qa-dev@360.cn
    //查看配置
    [root@localhost ~]# git config --list
    user.name=qadev
    user.email=g-qa-dev@360.cn
    [root@localhost ~]#
   ```
   
## 1.2 创建git用户
这步也可以不做，但使用git用户来专门管理git仓库是一个好的方式
1. 添加git用户
   ```shell
    adduser git
    passwd git #设置密码
   ```
2. 创建authorized_keys
   
   傅authorized_keys的方式可以轻松的在客户端登录，也可以限制git用户的密码登录，这样更加安全一些.

   ```shell
    cd /home/git
    mkdir .ssh
    cd .ssh
    touch authorized_keys

   ```
3. 添加客户端的公钥
   
   将客户端的公钥 id_rsa.pub 添加到 authorized_keys 中，一行一个。

4. 禁用git用户的shell
   
## 1.3 初始化git仓库
进入服务器终端
```shell
# 切换到git账号
$ su git

# 进入git账号的用户主目录。
$ cd /home/git

# 在用户主目录下创建 test.git仓库的文件夹
$ mkdir qadevdoc.git  && cd qadevdoc.git

# 在test.git目录下初始化git仓库
$ git init --bare

# 输出如下内容，表示成功
Initialized empty Git repository in /home/git/qadevdoc.git/
```

## 1.4 设置post-receive

post-receive 脚本是当有代码 push 过来的时候进行的操作，

```shell
cd /home/git/qadevdoc.git/hooks/
vim post-receive
```

将以下内容复制到post-receive中
```shell
#!/bin/bash
GIT_REPO=/home/git/qadevdoc.git #git仓库
TMP_GIT_CLONE=/tmp/gitbook
PUBLIC_WWW=/home/git/qadevdoc_www #网站目录
rm -rf ${TMP_GIT_CLONE}
git clone $GIT_REPO $TMP_GIT_CLONE
rm -rf ${PUBLIC_WWW}/*
cp -rf ${TMP_GIT_CLONE}/* ${PUBLIC_WWW}
chmod -R 777 ${PUBLIC_WWW}
```

这个脚本就是先用 git clone 将代码下载到临时文件，然后再将临时文件拷贝到nginx设置的web 根目录,添加执行权限 `chmod +x post-receive`

## 1.5 设置nginx

1. 安装nginx
   `yum install -y git nginx`

2. 设置网站
   
   在 `/etc/nginx/conf.d` 目录下创建 qadevdoc.conf 文档
   输入以下内容
   ```shell
    server {
    listen        8080;
    server_name    ~^\d+\.\d+\.\d+\.\d+$;
    #charset koi8-r;
    error_page  404  /404.html;
    # redirect server error pages to the static page /50x.html
    #
    error_page   500 503 504  /50x.html;
    error_log    /var/log/nginx/debug.log debug;
    index    index.html index.htm;
    root /home/git/qadevdoc_www/_book;
    }

   ```
   这样设置将niginx的8080端口映射到了 /home/git/qadevdoc_www/_book 目录，并且以index.html 作为index文件.
   
   注意，要修改nginx的启用用户是root，否则git里的内容读不出来,修改 `/etc/nginx/nginx.conf`，将`user nginx;`改为`user root;` 

   设置开机启动

    `$ sudo systemctl enable nginx`
   
   启动服务

   `$ sudo systemctl start nginx`

   重启服务

   `$ sudo systemctl restart nginx`
   
   停止服务

   `$ sudo systemctl stop nginx`

   重新加载，因为一般重新配置之后，不希望重启服务，这时可以使用重新加载。

   `$ sudo systemctl reload nginx`

## 1.6 客户端通过gitbook编写文档
1. clone仓库
   
   上面的新创建的仓库的地址为 `git@10.16.16.17:qadevdoc.git`,执行 `git clone git@10.16.16.17:qadevdoc.git`

   将一个空的git仓库下载到本地,之后使用gitbook进行编写，相应的文档参数[gitgook章节](/doc/gitbook.html)

2. 发布

   由于之前在仓库的hook中设置了post-receive，所以这里直接执行push后就可以实现文档发布了


