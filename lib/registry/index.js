var Q = require('../rpc/util/Q'),
    Config = require('../config/index'),
    Cluster = require('../rpc/cluster/index'),
    Zookeeper = require('node-zookeeper-client'),
    _ = require('underscore'),
    qs = require('querystring');
//-----------------------------------------------------------------------------------------------
//
//
//
//
//
//-----------------------------------------------------------------------------------------------
var Registry = function() {
    this.zookeeper = null;
    this.serviceMap = {};
    this.providrUrl = {};
    this.initQueue = [];
};

//-----------------------------------------------------------------------------------------------
// 往zookeeper注册
//-----------------------------------------------------------------------------------------------
Registry.prototype.init = function() {
    var self = this;
    this.isInitializing = true;
    this.zookeeper = Zookeeper.createClient(Config.getRegistryAddress(), Config.getRegistryOption());
    this.zookeeper.once('connected', function() {
        self.initQueue.forEach(function(p) { //从队列中获取, 逐个通知
            p.resolve(self.zookeeper);
        });
        self.isInitializing = false;
        console.log('Registry : 已连接上zookeeper');
    });
    this.zookeeper.connect();
};

//-----------------------------------------------------------------------------------------------
// 把invoke注册上来, 当zookeeper刷新
//-----------------------------------------------------------------------------------------------
Registry.prototype.register = function(invokerDesc, invoker) {
    var descStr = invokerDesc.toString(),
        serviceName = invokerDesc.getService();

    //判断是否已经订阅过
    if (!this.serviceMap[descStr]) {
        this.serviceMap[descStr] = invoker;
        //订阅
        this.subscribe(invokerDesc)
            .done(function(client) {
                var registryPath = Config.getRegistryPath(serviceName);
                console.log('Registry: consumer = [' + registryPath + ']');
                client.create(registryPath, null, Zookeeper.CreateMode.EPHEMERAL, function(err) {
                    if (err)
                        console.error('Registry : 注册失败 [' + descStr + '] [' + err.toString() + ']');
                    else
                        console.log('Registry : 注册成功 [' + descStr + ']');
                });
            });
    }
};

//-----------------------------------------------------------------------------------------------
// 获取Invoker
//-----------------------------------------------------------------------------------------------
Registry.prototype.getInvoker = function(invokerDesc) {
    var descStr = invokerDesc.toString();
    return this.serviceMap[descStr];
};

//-----------------------------------------------------------------------------------------------
// 获取zookeeper
//-----------------------------------------------------------------------------------------------
Registry.prototype.getZookeeper = function() {
    var defer = Q.defer();
    if (this.zookeeper) {
        defer.resolve(this.zookeeper);
    }
    //如果正在初始化中, 其他就不要初始化了, 加入队列等待
    else if (this.isInitializing) {
        this.initQueue.push(defer.promise);
    }
    return defer.promise;
};

//-----------------------------------------------------------------------------------------------
// 注册之前先订阅信息
//-----------------------------------------------------------------------------------------------
Registry.prototype.subscribe = function(invokerDesc) {
    var self = this,
        desc = invokerDesc.toString(),
        service = invokerDesc.getService(),
        path = Config.getSubscribePath(service);
    return this.getZookeeper()
        .then(function(client) {
            var callee = arguments.callee;
            if (!(client instanceof Object)) {
                client = self.zookeeper;
                console.log('服务发布时重新获取zookeeper实例 isObject = ' + (client instanceof Object) + ' isInitializing = ' + self.isInitializing + ' zookeeper = ' + self.zookeeper);
            }
            client.getChildren(path,
                function() {
                    callee();
                },
                function(err, children) {
                    if (err) {
                        console.error('Registry : 订阅失败 [' + desc + '] [' + err.toString() + ']');
                    } else if (children.length > 0) {
                        self.onMethodChangeHandler(invokerDesc, children);
                        console.log('Registry : 订阅成功 [' + desc + ']');
                    } else {
                        //console.warn('Registry : 尚未发现服务提供者 [' + desc + ']');
                    }
                });
            return client;
        })
        .then(function(client) {
            self.configurators(invokerDesc);
            return client;
        })
};

//-----------------------------------------------------------------------------------------------
// 更新服务提供的方法
//-----------------------------------------------------------------------------------------------
Registry.prototype.onMethodChangeHandler = function(invokerDesc, children) {
    var providerHosts = [];
    children.forEach(function(child) {
        child = decodeURIComponent(child);
        var mHost = /^jsonrpc:\/\/([^\com]+)\//.exec(child);
        if (invokerDesc.getProtocol() === "dubbo") {
            mHost = /^dubbo:\/\/([^\/]+)\//.exec(child);
        }

        var mVersion = /version=(.+)/.exec(child),
            mGroup = /group=([^&]+)/.exec(child),
            mMehtod = /methods=([^&]+)/.exec(child);

        //有方法, 并且匹配成功
        console.log('subscribe: [' + child + ']');
        if (mHost && mMehtod && invokerDesc.isMatch(mGroup && mGroup[1], mVersion && mVersion[1])) {
            this.serviceMap[invokerDesc.toString()].setMethod(mMehtod[1].split(','));
            Cluster.setParameter(invokerDesc, mHost[1], qs.parse(child));
            console.info('Registry : 提供者 [' + invokerDesc + '] HOST [' + mHost[1] + ']');
            providerHosts.push(mHost[1]);
        }

    }.bind(this));
    Cluster.addProviderList(invokerDesc, providerHosts);
    Cluster.refreshProvider(invokerDesc);
};

//-----------------------------------------------------------------------------------------------
// 更新服务提供的权重
//-----------------------------------------------------------------------------------------------
Registry.prototype.configurators = function(invokerDesc) {
    var serviceName = invokerDesc.getService(),
        path = Config.getConfiguratorsPath(serviceName),
        self = this;
    this.getZookeeper()
        .done(function(client) {
            var callee = arguments.callee;
            if (!(client instanceof Object)) {
                client = self.zookeeper;
            }
            client.getChildren(path,
                function() {
                    callee();
                },
                function(err, children) {
                    if (err) {
                        console.error('Registry : 获取权重失败 [' + serviceName + '] [' + err.toString() + ']');
                    } else if (children.length > 0) {
                        children.forEach(function(child) {
                            child = decodeURIComponent(child);
                            var mHost = /^override:\/\/([^\/]+)\//.exec(child),
                                mVersion = /version=([^&]+)/.exec(child),
                                mGroup = /group=([^&]+)/.exec(child),
                                mDisabled = /disabled=([^&]+)/.exec(child),
                                mEnable = /enabled=([^&]+)/.exec(child),
                                mWeight = /weight=(\d+)/.exec(child);

                            console.log('服务权重更新前 provider = [' + child + ']');
                            if ((mEnable && mEnable[1] == 'true') && (mDisabled == null || mDisabled[1] == 'false') && invokerDesc.isMatch(mGroup && mGroup[1], mVersion && mVersion[1])) { //可用
                                Cluster.setProviderWeight(invokerDesc, mHost[1], mWeight ? mWeight[1] : Config.getDefaultWeight()); //没权重的默认1拉
                            }
                        });
                        console.log('Registry : 获取权重成功 [' + serviceName + '] ');
                    } else {
                        console.warn('Registry : 获取权重失败 [' + serviceName + '] [ 尚未发现服务提供者 ]');
                    }
                });
        });
};


//-----------------------------------------------------------------------------------------------
// 更新方法
//-----------------------------------------------------------------------------------------------
Registry.prototype.destroy = function() {
    //TODO: 现在有问题, 后期处理
};

//-----------------------------------------------------------------------------------------------
//
//
//
//
//
//-----------------------------------------------------------------------------------------------
var registry = new Registry();
module.exports = registry;

//-----------------------------------------------------------------------------------------------
// 更新方法
//-----------------------------------------------------------------------------------------------
// process.on('SIGINT', registry.destroy);
// process.on('exit', registry.destroy);
