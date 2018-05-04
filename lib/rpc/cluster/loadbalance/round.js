var Q = require('q'),
    LoadBalance = require('./index'),
    _ = require('underscore'),
    util = require('util');

//-----------------------------------------------------------------------------------------------
//
//
// 轮询算法
//
//
//-----------------------------------------------------------------------------------------------
var RoundLoadBalance = function () {
    this.serviceCount = {};
    LoadBalance.call(this);
};
util.inherits(RoundLoadBalance, LoadBalance);

//-----------------------------------------------------------------------------------------------
//
//-----------------------------------------------------------------------------------------------
RoundLoadBalance.prototype.init = function () {
};

//-----------------------------------------------------------------------------------------------
//
//-----------------------------------------------------------------------------------------------
RoundLoadBalance.prototype._getProvider = function (invokerDesc, providerList, invoked) {
    providerList = this.doSelectProviderHost(providerList, invoked);
    var desc = invokerDesc.toString(),
        callCount = -1;
    if (this.serviceCount[desc] == "undefined" || this.serviceCount[desc] == null) {
        this.serviceCount[desc] = -1;
    }
    callCount = this.serviceCount[desc];
    callCount++;
    this.serviceCount[desc] = callCount;
    var index = callCount % providerList.length;
    return providerList[index];
};

//-----------------------------------------------------------------------------------------------
//
//
//
//
//
//-----------------------------------------------------------------------------------------------
module.exports = RoundLoadBalance;