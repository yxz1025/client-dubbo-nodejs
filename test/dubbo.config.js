module.exports = {

    /**
     *
     */
    application: {
        'application': 'dubbo_node_client',
        'application.version': '1.0',
        'category': 'consumers',
        'dubbo': '2.5.3',
        'side': 'consumer',
        'pid': process.pid,
        'version': '1.0'
    },


    /**
     * 注册中心
     */
    registry: '172.16.150.60:2181',

    /**
    *  dubbo config
    */
    dubbo: {
            providerTimeout: 3,
            weight: 100
    },

    /**
     * 负载均衡规则, 目前支持轮询、权随机 round,random
     */
    loadbalance: 'random',

    /*
    *  集群容错模式，目前只支持 failover
    */
    cluster: 'failover',
    /**
     * 懒加载, 用于开发阶段, 快速启动
     */
    lazy: false,

    /**
    * dubbo:reference，先注册服务
    */
    reference: [
        {
            'interface': 'com.xxx.dubbo.renew.api.front.RenewServiceApi',
            'version': '1.0',
            'group': null,
            'protocol': 'dubbo'
        }
    ]
};