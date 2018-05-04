

# 如何安装

该项目基于dubbo-node-client（不支持dubbo协议）思路，修改为同时<font color=red> 支持 [jsonrpc协议] [dubbo协议]服务提供者调用方式</font>：

 - 功能如下：
 - 支持round和random两种路由方式
 - 支持failover容错机制
 - 可以指定某个服务的使用协议，比如：jsonrpc或dubbo
 - random路由方式支持权重动态调整
 - 具体调用方式及配置，请看test目录下具体案例

# 如何使用

使用dubbo协议请求，需要事先将服务注册到内存中，启动及注册，每个服务的service都是全局变量

## 消费者

```javascript
//
var dubboClient = require('client-dubbo-nodejs');
//加载配置文件
dubboClient.config(require('./dubbo.config.js'));

//新增 DUBBO方式调用如下：
// dubbo协议方式调用
router.get('/test', async function(ctx, next) {
    var data = {
        "$class": "com.lefit.dubbo.coach.api.goods.request.LessonSkuTypeReq",
        "$": {"goodsNo": "01241", "coachId": 120, "userId": 105424}
    };
    var res;
    try{
        res = await DubboReference.genericService('com.xxx.dubbo.order.api.AutoBuyPayChannelService').callRpc('buildRequestWxAgreement', data);
    }catch(e){
        res = e.message;
    }
     return ctx.body = {
        'code': 0,
        'message': "success",
        'data': res
     };
};


```