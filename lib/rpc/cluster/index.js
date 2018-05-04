var Q = require('q'),
    Config = require('../../config/index'),
    RandomBalance = require('./loadbalance/random'),
    RoundBalance = require('./loadbalance/round'),
    _ = require('underscore');

//-----------------------------------------------------------------------------------------------
//
//
//
//
//
//-----------------------------------------------------------------------------------------------
var Cluster = function() {
    //服务对应的[ip:host]
    this.providerMap = {};
    this.promiseMap = {};
    this.providerTimeoutMap = {};
    //调用次数
    this.serviceCount = {};
    this.loadbalance = null;
};

//通过配置判断需要初始化哪个路由
Cluster.prototype.init = function(){
    console.log('配置路由策略 loadbalance = ' + Config.getLoadBalance());
    var Balance = require('./loadbalance/' + Config.getLoadBalance());
    this.loadbalance = new Balance();
};

//获取服务url所有配置
Cluster.prototype.getParameter = function(invokerDesc, providerHost) {
    return this.loadbalance.getParameter(invokerDesc, providerHost);
}

//设置服务provider所有配置
Cluster.prototype.setParameter = function(invokerDesc, providerHost, params) {
    this.loadbalance.setParameter(invokerDesc, providerHost, params);
}

//-----------------------------------------------------------------------------------------------
// 删除provider --- 服务不可用时
//-----------------------------------------------------------------------------------------------
Cluster.prototype.removeProvider = function(invokeDesc, providerHost) {
    var desc = invokeDesc.toString(),
        h = this.promiseMap[desc];
    if (h) {
        var i = _.indexOf(h, providerHost);
        h.slice(i, 1);
    }
    return h;
};

//---
//-----------------------------------------------------------------------------------------------
// 当监听服务变更时需要查询是否已经存在host
//-----------------------------------------------------------------------------------------------
Cluster.prototype.findProviderHost = function(hosts, providerHost) {
    var i = hosts.length;
    while (i--) {
        if (hosts[i] === providerHost) {
            return true;
        }
    }
    return false;
};


//-----------------------------------------------------------------------------------------------
// providerList 每次服务节点的更新或新增，需要刷新缓存
//-----------------------------------------------------------------------------------------------
Cluster.prototype.addProviderList = function(invokeDesc, providerHosts) {
    var desc = invokeDesc.toString();
    this.providerMap[desc] = providerHosts;
    return providerHosts;
};

//-----------------------------------------------------------------------------------------------
// 新增provider
//-----------------------------------------------------------------------------------------------
Cluster.prototype.addProvider = function(invokeDesc, providerHost) {
    var desc = invokeDesc.toString(),
        h = this.providerMap[desc] || [];
    if (!this.findProviderHost(h, providerHost)) {
        h.push(providerHost);
    }
    this.providerMap[desc] = h;
    return h;
};

//-----------------------------------------------------------------------------------------------
// 刷新provider
//-----------------------------------------------------------------------------------------------
Cluster.prototype.refreshProvider = function(invokeDesc) {
    //
    var desc = invokeDesc.toString(),
        h = this.providerMap[desc];

    //
    var list = this.promiseMap[desc];
    if (h && list) {
        //移除超时提示
        delete this.providerTimeoutMap[desc];

        //逐个通知
        this.promiseMap[desc] = [];
        for (var i = 0; i < list.length; i++) {
            list[i].resolve(h);
        }
    }
};

//-----------------------------------------------------------------------------------------------
// 获取所有provider
//-----------------------------------------------------------------------------------------------
Cluster.prototype.getAllProvider = function(invokerDesc) {
    var desc = invokerDesc.toString(),
        q = Q.defer();
    if (this.providerMap[desc]) {
        console.log("缓存中获取提供者 providerMap = " + JSON.stringify(this.providerMap[desc]));
        q.resolve(this.providerMap[desc]);
    } else {
        //
        this.promiseMap[desc] = this.promiseMap[desc] || [];
        this.promiseMap[desc].push(q);

        //
        var index = this.promiseMap.length - 1;
        this.providerTimeoutMap[desc] = setTimeout(function() {
            q.reject('获取服务提供者超时 [' + desc + ']');
            this.promiseMap[desc].slice(index, 1);
        }.bind(this), Config.getProviderTimeout());
    }
    return q.promise;
};

//-----------------------------------------------------------------------------------------------
// 获取provider
// @param invoked 表示上一次选中的地址 ip:host
//-----------------------------------------------------------------------------------------------
Cluster.prototype.getProvider = function(invokerDesc, invoked) {
    return this.getAllProvider(invokerDesc).then(function(ps) {
        if (ps.length <= 1) {
            return ps[0] || '';
        //If we only have two invokers, use round-robin instead.
        } else if(ps.length == 2 && invoked != null && invoked.length > 0){
            return invoked[0] == ps[0] ? ps[1] : ps[0];
        }else {
            return this.loadbalance._getProvider(invokerDesc, ps, invoked);
        }
    }.bind(this));
};

//-----------------------------------------------------------------------------------------------
// 设置provider的权重
//-----------------------------------------------------------------------------------------------
Cluster.prototype.setProviderWeight = function(invokerDesc, providerHost, weight) {
    this.loadbalance.setProviderWeight(invokerDesc, providerHost, weight);
};

//获取provider的权重
Cluster.prototype.getProviderHostWeight = function(invokerDesc, providerHost){
    return this.loadbalance.getProviderHostWeight(invokerDesc, providerHost);
};

//-----------------------------------------------------------------------------------------------
//
//
//
//
//
//-----------------------------------------------------------------------------------------------
module.exports = new Cluster();