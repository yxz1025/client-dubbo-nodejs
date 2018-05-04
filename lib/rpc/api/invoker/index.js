var Q = require('q'),
    _ = require('underscore'),
    Cluster = require('../../cluster/index'),
    Config = require('../../../config/index'),
    FailOverCluster = require('../../cluster/support/failover'),
    HttpClient = require('../../util/Http'),
    SocketClient = require('../../util/Socket');

//-----------------------------------------------------------------------------------------------
//
//
//
//
//
//-----------------------------------------------------------------------------------------------

var Invoker = function(invokerDesc) {
        this.invokerDesc = invokerDesc;
        this.init();
    };


//初始化集群容错模式
Invoker.prototype.init = function() {
   console.log('service = ' + this.invokerDesc + ' 容错模式 cluster = ' + Config.getCluster());
   this.clusterMode = require('../../cluster/support/' + Config.getCluster());
};

//-----------------------------------------------------------------------------------------------
// 对外只有一个方法, 和代理提供的callrpc方法
//-----------------------------------------------------------------------------------------------
Invoker.prototype.callRpc = function(methodName) {
    var methodArgs = _.toArray(arguments).slice(1);
    return this.clusterMode
        .doInvoker(this.invokerDesc, methodName, methodArgs)
        .then(function(response) {
            return response;
        })
        .catch(function(e) {
            throw new Error(e.message);
        });
};
//-----------------------------------------------------------------------------------------------
//
//
//
//
//
//-----------------------------------------------------------------------------------------------
module.exports = Invoker;
