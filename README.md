loader[![Build Status](https://secure.travis-ci.org/TBEDP/loader.png?branch=master)](http://travis-ci.org/TBEDP/loader)
======

Node静态资源加载器。该模块通过两个步骤配合完成，代码部分根据环境生成标签。上线时，需要调用minify方法进行静态资源的合并和压缩。

# Usage
## Installation

```
npm install loader
```
## Example

```
<%- Loader("/assets/scripts/jqueryplugin.min.js", "/assets/styles/jqueryplugin.min.css")
  .js("/assets/scripts/lib/jquery.jmodal.js")
  .js("/assets/scripts/lib/jquery.mousewheel.min.js")
  .js("/assets/scripts/lib/jquery.tagsphere.min.js")
  .css("/assets/styles/jquery.autocomplate.css")
  .done(env, version) %>
```
### 线上输出
线上模式将会输出合并和压缩后的地址，该地址从Loader构造参数中得到。  

```
<script src="/assets/scripts/jqueryplugin.min.js?version=version"></script>
<link rel="stylesheet" href="/assets/styles/jqueryplugin.min.css?version=version" media="all" />
```

### 线下输出
线下模式输出为原始的文件地址。

```
<script src="/assets/scripts/lib/jquery.jmodal.js"></script>
<script src="/assets/scripts/lib/jquery.mousewheel.min.js"></script>
<script src="/assets/scripts/lib/jquery.tagsphere.min.js"></script>
<link rel="stylesheet" href="/assets/styles/jquery.autocomplate.css" media="all" />
```

## API
### Loader(mincss, minjs)
构造函数，参数为CSS和JS的合并文件地址，根据后缀名判断，顺序可以互换，但是不能同时为CSS或JS文件。后续通过css或者js加载的文件，都会合并到这两个文件中。  
### css(path)
加载CSS文件。  
### js(path)
加载JS文件。  
### done(env, version)
根据env参数和version参数生成最终的加载标签。  
`env`：值为`production`或其他。  
`version`：值为静态文件的版本号，用于生产环境。  
### Loader.scanDir(folder)
从指定目录扫描Loader的调用，返回一个扫描得到的合并压缩关系数组。这个关系数组最终将用于生成合并压缩的文件。  
`folder`：扫描的目录  
`return`：
```
[
  {min: "x.min.js", assets:["path1", "path2"]},
  {min: "x.min.css", assets:["path1", "path2"]}
]
```
### Loader.minify(basedir, arr, [justCombo])
从扫描得到的压缩关系数组中进行合并和压缩文件。  
`basedir`：基本路径，生成的文件将放在此目录下。  
`arr`：`scanDir`方法返回的关系数组。  
`justCombo`：如果此参数为true，将不会通过uglify进行编译压缩，仅进行合并，多用于调试线上bug用。

# License
MIT license