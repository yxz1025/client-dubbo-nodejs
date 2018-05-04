//-----------------------------------------------------------------------------------------------
//
//
//
//
//
//-----------------------------------------------------------------------------------------------
var InvokerDesc = function (serviceName, group, version, protocol) {
    this.serviceName = serviceName;
    this.group = group ? group + '' : null;
    this.version = version ? version + '' : null;
    this.protocol = protocol ? protocol + '' : 'dubbo';
};


InvokerDesc.prototype.getProtocol = function(){
	return this.protocol;
};
//-----------------------------------------------------------------------------------------------
//
//-----------------------------------------------------------------------------------------------
InvokerDesc.prototype.isMatch = function (group, version) {
    return this.group == group && this.version == version;
};

//-----------------------------------------------------------------------------------------------
//
//-----------------------------------------------------------------------------------------------
InvokerDesc.prototype.getService = function () {
    return this.serviceName;
};

InvokerDesc.prototype.getVersion = function() {
	return this.version;
};
//-----------------------------------------------------------------------------------------------
//
//-----------------------------------------------------------------------------------------------
InvokerDesc.prototype.isMatchDesc = function (desc) {
    return this.group == desc.group && this.version == desc.version;
};

//-----------------------------------------------------------------------------------------------
//
//-----------------------------------------------------------------------------------------------
InvokerDesc.prototype.toString = function () {
    return this.serviceName + '_' + (this.group || ' ') + '_' + (this.version || ' ');
};


//-----------------------------------------------------------------------------------------------
//
//
//
//
//
//-----------------------------------------------------------------------------------------------
module.exports = InvokerDesc;