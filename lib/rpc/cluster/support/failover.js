//集群容错 ---- 失败转移
var Cluster = require('../index'),
    Config = require('../../../config/index'),
    SocketClient = require('../../util/Socket'),
    HttpClient = require('../../util/Http'),
    co = require('co'),
    IP = require('../../util/IP'),
    time = new Date().getTime(),
    toUrl = function(provider, serviceName) {
        return 'http://' + provider + '/' + serviceName
    },
    toPostData = function(methodName, methodArgs) {
        var postData = {
            "jsonrpc": "2.0",
            "method": methodName,
            "params": methodArgs,
            "id": time--
        };
        return postData;
    };

var FailOverCluster = function() {

};

FailOverCluster.prototype.doInvoker = co.wrap(function*(invokerDesc, methodName, methodArgs) {
    var service = invokerDesc.serviceName,
        protocol = invokerDesc.protocol,
        error = null,
        invoked = [],
        retries = Config.getDefaultRetries();

    if (retries <= 0) {
        retries = 1;
    }
 	
    for (var i = 0; i < retries; i++) {
    	var providerHost, response;
        try {
        	providerHost = yield Cluster.getProvider(invokerDesc, invoked);
            if (error != null) {
            	console.error("Although retry the method " + methodName
                            + " in the service " + invokerDesc
                            + " was successful by the provider " + providerHost
                            + ", but there have been failed providers " + invoked
                            + " (" + invoked.length 
                            + ") from the registry " + Config.getRegistryAddress()
                            + " on the consumer " + IP.getLocalIP()
                            + ". Last error is: "
                            + error);
            }
            if (protocol === 'dubbo') {
                response = yield SocketClient.execute(providerHost, service, methodName, invokerDesc.getVersion(), methodArgs);
            }else{
                var url = toUrl(providerHost, service);
                methodArgs = toPostData(methodName, methodArgs);
                response = yield HttpClient.post(url, methodArgs);
            }
            
            return response;
        } catch (e) {
            error = e;
            console.log("发起请求异常 Error = [" + e.message + ']');
        } finally{
        	invoked.push(providerHost);
        }
    }
    throw new Error("Failed to invoke the method " +
        methodName + " in the service " + invokerDesc +
        ". Tried " + retries + " times of the providers " + invoked +
        "from the registry " + Config.getRegistryAddress() +
        " on the consumer " + IP.getLocalIP() + ". Last error is: " +
        error
    );
});
module.exports = new FailOverCluster();
