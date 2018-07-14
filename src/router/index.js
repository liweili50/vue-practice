import Vue from 'vue'
import Router from 'vue-router'
import Routers from './routers.js'
import store from '../store/index'
import Util from '../utils/index'
Vue.use(Router)

const RouterConfig = {
  mode: 'history',
  routes: Routers
}
const router = new Router(RouterConfig)
const whiteList = ['/login'];

router.beforeEach((to, from, next) => {
  if (localStorage.getItem('token')) {
    if (to.path === '/login') {
      next()
    } else {
      if (store.getters.roles.length === 0) {
        store.dispatch('GetUserInfo').then(res => { // 拉取user_info
          const roles = res.data.rolesList;
          console.log(res)
          store.dispatch('GenerateRoutes', { roles }).then(() => { // 生成可访问的路由表
            router.addRoutes(store.getters.addRouters) // 动态添加可访问路由表
            next(to) // hack方法 确保addRoutes已完成
          })
          next()
        }).catch(function (error) {
          console.log(error)
          console.log('拉取用户信息失败，重新登陆！')
          next('/login')
        })
      } else {
        next()
      }
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) { // 在免登录白名单，直接进入
      next()
    } else {
      next('/login') // 否则全部重定向到登录页
    }
  }
})

router.afterEach((to, from, next) => {
  let routerObj = {};
  routerObj.name = to.meta.name;
  routerObj.title = to.meta.title;
  routerObj.path = to.path;
  if (routerObj.name) {
    store.dispatch('AddTab', routerObj);
    // tab栏选择对应侧边栏
    let pathArr = to.path.split('/');
    if (pathArr.length <= 2) {
      store.dispatch('SetActiveMenu', '0-0')
    } else {
      let firstHalf = '/' + pathArr[1];
      let lastHalf = pathArr[2];
      let allRouters = store.getters.addRouters;
      let targetRouter = allRouters.find(function(router) {
        return router.path === firstHalf
      })
      let targetIndex = allRouters.indexOf(targetRouter) + '-' + targetRouter.children.indexOf(targetRouter.children.find(function (router) {
        return router.path === lastHalf
      }))
      store.dispatch('SetActiveMenu', targetIndex)
    }
  }
  Util.title(to.meta.title)  // 设置title
  store.dispatch('GetCurrentRoute', to)
})

export default router
