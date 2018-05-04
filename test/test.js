var _ = require('underscore'),
    dubboClient = require('../index');

//加载配置文件
dubboClient.config(require('./dubbo.config.js'));

////获取serivce
var catQueryProvider = dubboClient.getService('com.xxx.dubbo.renew.api.front.RenewServiceApi', '1.0');

// dubbo协议方式调用
var data = {
  "$class": "com.xxx.dubbo.renew.api.requests.CommonRequest",
  "$": {
    "flag": true,
    "requestData": {
      "$class": 'com.xxx.dubbo.renew.dto.AutoRenewChargeDto',
      "$": {
        "userId": 105424,
        "goodsNo": "01241"
      }
    }
  }
};

// catQueryProvider.callRpc('autoRenewCharge', data)
//     .then(function (r) {
//         console.info(r);
//         // process.exit(0);
//     })
//     .catch(function (e) {
//         console.error(JSON.stringify(e.message));
//         // process.exit(0);
//     });

//泛化调用方式
dubboClient.genericService('com.xxx.dubbo.renew.api.front.RenewServiceApi')
    .callRpc('autoRenewCharge', data)
    .then(function (r) {
        console.info(r);
        // process.exit(0);
    })
    .catch(function (e) {
        console.error(JSON.stringify(e.message));
        // process.exit(0);
    });
//jsonrpc 方式调用
// catQueryProvider.call('goodsSkuDetail', 111)
//     .then(function (r) {
//         console.info(r);
//         process.exit(0);
//     })
//     .catch(function (e) {
//         console.error(JSON.stringify(e));
//         process.exit(0);
//     });


