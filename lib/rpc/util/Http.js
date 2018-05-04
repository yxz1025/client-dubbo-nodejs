var Q = require('q'),
    Request = require('request');

//-----------------------------------------------------------------------------------------------
//
//
//
//
//
//-----------------------------------------------------------------------------------------------
var HttpClient = function() {};

HttpClient.prototype = {
    get: function() {
        return HttpClient.get.apply(this, arguments);
    },
    post: function() {
        return HttpClient.post.apply(this, arguments);
    }
};

//-----------------------------------------------------------------------------------------------
// Get请求
//-----------------------------------------------------------------------------------------------
HttpClient.get = function() {};

//-----------------------------------------------------------------------------------------------
// Post请求
//-----------------------------------------------------------------------------------------------
HttpClient.post = function(url, data) {
    var q = Q.defer();
    Request({
        url: url,
        method: 'post',
        body: JSON.stringify(data)
    }, function(err, response, body) {
        if (err) {
            q.reject('网络错误。。');
        } else {
            body = JSON.parse(body);
            if (body.error) {
                q.reject(body.error);
            } else {
                q.resolve(body.result);
            }
        }
    });
    return q.promise;
};


//-----------------------------------------------------------------------------------------------
//
//
//
//
//
//-----------------------------------------------------------------------------------------------
module.exports = HttpClient;
