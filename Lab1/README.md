# 数据库设计 Lab1

## 目录

[toc]

## 架构

- 语言： TypeScript[NodeJS v18.8.0]
- 数据库： SQLite3（npm包`better-sqlite3`随附）**（SQLite不会占用端口，直接对db文件进行操作）**
- 操作：
  - `create table`
  - `insert into`
  - `on conflict`**（SQLite及PostgreSQL非标准语法Upsert）**参见[SQLite Query Language: upsert](https://www3.sqlite.org/lang_UPSERT.html)
  - `update when`
  - `select when`
- 数据库各表设计：静态元数据注入（注解）

- 数据库操作设计：原型类型检测+SQL安全语句构建

## Run-At-Glance

**程序附有一键配置环境以及启动脚本**。但是，需要确保电脑中有如下配置环境：

- 一个版本不太低的Node（本机：`node 18.8.0`）
- （最好已经配置好镜像站的）npm，以及网络

### Windows

在当前文件夹（根目录）下打开PowerShell，并需要确保`ExecutionPolicy`允许运行外部脚本

**运行：**

```powershell
.\starter\start-lab1.ps1
```

### Linux

根目录下打开`shell`

**运行：**

```shell
./starter/start-lab1.sh
```
