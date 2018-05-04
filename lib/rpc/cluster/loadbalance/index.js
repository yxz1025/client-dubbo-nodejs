var Config = require('../../../config/index');

//-----------------------------------------------------------------------------------------------
//
//
//
//
//
//-----------------------------------------------------------------------------------------------
var LoadBalance = function() {
    this.providerWeightMap = {};
    this.urlParams = {};
    this.init();
};


//-----------------------------------------------------------------------------------------------
//
//-----------------------------------------------------------------------------------------------
LoadBalance.prototype.init = function() {};

//设置服务暴露的URL参数配置信息
LoadBalance.prototype.setParameter = function(invokerDesc, providerHost, params) {
    this.urlParams[invokerDesc.toString() + '_' + providerHost] = params;
};

//获取服务url所有配置
LoadBalance.prototype.getParameter = function(invokerDesc, providerHost) {
    return this.urlParams[invokerDesc.toString() + '_' + providerHost];
}


//-----------------------------------------------------------------------------------------------
// 设置权重
//-----------------------------------------------------------------------------------------------
LoadBalance.prototype.setProviderWeight = function(invokerDesc, providerHost, weight) {
    this.providerWeightMap[invokerDesc.toString() + '_' + providerHost] = weight;
};

//-----------------------------------------------------------------------------------------------
// 获取权重
//-----------------------------------------------------------------------------------------------
LoadBalance.prototype.getProviderHostWeight = function(invokerDesc, providerHost) {
    var weight = this.providerWeightMap[invokerDesc.toString() + '_' + providerHost] || Config.getDefaultWeight();
    if (weight > 0) {
        var timestamp = this.getParameter(invokerDesc.toString(), providerHost).timestamp || 0;
        if (timestamp > 0) {
            var uptime = parseInt(new Date().getTime() - timestamp);
            var warmup = 10 * 60 * 1000;
            if (uptime > 0 && uptime < warmup) {
                weight = this.calculateWarmupWeight(uptime, warmup, weight);
            }
        }
    }
    return weight;
};

LoadBalance.prototype.calculateWarmupWeight = function(uptime, warmup, weight) {
    var ww = parseInt((parseFloat(uptime + '') / (parseFloat(warmup + '') / parseFloat(weight + ''))) + "");
    return ww < 1 ? 1 : (ww > weight ? weight : ww);
};

//计算数组差集，剔除请求失败的host:port
LoadBalance.prototype.doSelectProviderHost = function(providerHosts, selectedList) {
    if (selectedList == null || selectedList.length == 0) {
        return providerHosts;
    }
    return providerHosts.filter(key => !selectedList.includes(key));
};
//-----------------------------------------------------------------------------------------------
//
//
//
//
//
//-----------------------------------------------------------------------------------------------
module.exports = LoadBalance;
