var Config = require('./lib/config/index'),
    Invoker = require('./lib/rpc/api/invoker/index'),
    InvokerDesc = require('./lib/rpc/api/invoker/desc'),
    _ = require('underscore'),
    InvokerProxy = require('./lib/rpc/api/invoker/proxy'),
    Cluster = require('./lib/rpc/cluster/index'),
    Registry = require('./lib/registry/index');


//-----------------------------------------------------------------------------------------------
//
//
//
//
//-----------------------------------------------------------------------------------------------
var Application = function() {
    this.referenceObj = {};
};

/**
 * 配置加载
 */
Application.prototype.config = function(path) {
    Config.load(path);
    Registry.init();
    Cluster.init();
    this.init();
};

Application.prototype.init = function() {
    this.loadConfigService();
};

//加载配置文件中所有的serice 返回key:value对象
Application.prototype.loadConfigService = function() {
    var referenceMap = Config.getReference();
    var self = this;
    referenceMap.forEach(function(item) {
        if (typeof(item.interface) != 'undefined' && item.interface != null && item.interface != '') {
            console.log('[DUBBO] Refer dubbo service ' + item.interface + ' from url ' + Config.getRegistryPath(item.interface));
            self.referenceObj[item.interface] = self.getService(item.interface, item.version, item.group, item.protocol);
        }
    });
};

/**
 * jsonrpc || dubbo 调用, 主要调用入口
 * 不能同时使用jsonrpc或dubbo协议调用服务
 * @param serviceName
 * @param version
 * @param group
 */
Application.prototype.getService = function(serviceName, version, group, protocol) {
    var invokerDesc = new InvokerDesc(serviceName, group, version, protocol),
        invoker = Registry.getInvoker(invokerDesc);
    if (!invoker) {
        invoker = new Invoker(invokerDesc);
        Registry.register(invokerDesc, new InvokerProxy(invoker, invokerDesc));
    }
    return invoker;
};

/**
 * 泛型化调用 -- 服务注册从配置文件读取，返回服务interfance:对象集合map
 */
Application.prototype.genericService = function(serviceName) {
    return this.referenceObj[serviceName];
};

module.exports = new Application();
