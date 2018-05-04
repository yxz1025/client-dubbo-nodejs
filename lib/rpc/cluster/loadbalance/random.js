var Q = require('q'),
    LoadBalance = require('./index'),
    _ = require('underscore'),
    util = require('util');

//-----------------------------------------------------------------------------------------------
//
//
// 随机算法
//
//
//-----------------------------------------------------------------------------------------------
var RandomLoadBalance = function () {
    LoadBalance.call(this);
};

util.inherits(RandomLoadBalance, LoadBalance);
// RandomLoadBalance.prototype = new LoadBalance();

//-----------------------------------------------------------------------------------------------
//
//-----------------------------------------------------------------------------------------------
RandomLoadBalance.prototype._getProvider = function (invokerDesc, providerList, invoked) {
    providerList = this.doSelectProviderHost(providerList, invoked);
    var length = providerList.length, //总个数
        totalWeight = 0,  //总权重
        i = 0,
        sameWeight = true; //权重是否一样
    for (i = 0; i < length; i++) {
        var weight = parseInt(this.getProviderHostWeight(invokerDesc, providerList[i]));
        totalWeight += weight; //累计总权重
        if (sameWeight && i > 0 && weight != parseInt(this.getProviderHostWeight(invokerDesc, providerList[i - 1]))) { //计算所用权重是否一样
            sameWeight = false;
        }
    }

    console.log("总权重值 totalWeight = " + totalWeight + ' sameWeight = ' + sameWeight);
    if (totalWeight > 0 && !sameWeight) {
        // 如果权重不相同且权重大于0则按总权重随机
        var offset = Math.ceil(Math.random() * totalWeight);

        //并确定随机值落在哪个片段上
        for (i = 0; i < length; i++) {
            offset -= parseInt(this.getProviderHostWeight(invokerDesc, providerList[i]));
            if(offset < 0){
                return providerList[i];
            }
        }
    }
    var r = Math.ceil(Math.random() * length) - 1;
    return providerList[r];
};

//-----------------------------------------------------------------------------------------------
//
//
//
//
//
//-----------------------------------------------------------------------------------------------
module.exports = RandomLoadBalance;