# vue-router-dom-cache [![Build Status](https://img.shields.io/circleci/project/github/vuejs/vue-router/dev.svg)](https://circleci.com/gh/vuejs/vue-router)

> 基于vue-router [v3.0.2](https://github.com/vuejs/vue-router/releases/tag/v3.0.2)的二次开发，主要是为了实现路由切换后，保存历史页面的dom，配合页面转场动画效果，实现类似ios原生切换的效果。

> 注意：目前只是针对mode: 'hash'、'history' 模式的路由做了处理，'abstract'模式和不支持history api的浏览器未做处理。如果有问题或者有需要可以与我们 [联系](https://github.com/ideacome-frontend)，我们会继续完善这个项目。

### Introduction

`vue-router-dom-cache` 是为了能让移动端上使用vue+vue-router的应用可以实现ios上原生应用的效而开发的，在vue-router v3.0.2的基础上，增加了router-views组件，并在router实例上增加了direction属性，用于判断页面跳转方向，direction的值有：
- `forward`：通过调用this.$router.push(args)或者window.history.go(n) n>0
- `back`：通过调用this.$router.back()或者window.history.go(n) n<0
- `refresh`：通过调用this.$router.replace(args)或者window.history.go(0)
- `replace`：通过调用this.$router.replace()


### Usage

``` bash
# install deps
npm install vue-router-dom-cache

# import 
import VueRouter from 'vue-router-dom-cache'

# use plugins
Vue.use(VueRouter)

# use router-views in template
<router-views class="view"/>

# add global animate css 
//以下样式为页面切换的效果动画，效果参数可以自己定义
.router-slid-enter-active{
    transition:all .3s linear;
}

.router-slid-leave-active{
    transition:all .3s linear;
}

.router-slid-enter, .router-slid-leave-to{
    transform:translate3d(100%, 0, 0);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s ease;
}

.fade-enter, .fade-leave-active {
  opacity: 0;
}

.cached {
  display: none
}

//.view 为demo中演示的非必须样式，可以不加，根据具体的场景自己定义
.view {
  box-sizing: border-box;
  position: absolute;
  left: 0;
  top: 250px;
  background: #efeff4;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  width: 100%;
  height: 100%;
}

```

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2018-present ideacome-f2e


