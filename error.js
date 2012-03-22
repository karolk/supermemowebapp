(function() {
var errorCount = 0,
    loggingURL = 'http://korowaj.com/vocavoca/error.php';
    
window.onerror = function(errorMessage, fileName, lineNumber) {
        
    var whiteList = [];
    //JS errors like to cascade, we do not want all of them
    //but just the first one
    
    if (!errorCount) {
        
        errorCount++;
        
        var gather = {
                event: ['screenLeft', 'screenTop'],
                screen: ['width', 'height', 'availWidth', 'availHeight'],
                navigator: ['systemLanguage', 'userLanguage', 'language', 'userAgent'],
                location: ['href'],
                history: ['length']
        };
       
        var ret = {
            errorMessage: errorMessage,
            fileName: fileName,
            lineNumber: lineNumber
        }
        
        for (var namespace in gather) {
            if (typeof this[namespace] !== 'undefined') {
                ret[namespace]={}
                for (var i=0, l=gather[namespace].length; i<l; i++) {
                    if (typeof this[namespace][gather[namespace][i]] !== 'undefined') {
                        ret[namespace][gather[namespace][i]] = this[namespace][gather[namespace][i]];
                    }
                }
            }
        }
        
        var errorLogEntry = JSON.stringify(ret);
        
        location.pathname.indexOf('test') && alert(errorLogEntry)
        
    }
    //returning true will cause the error be caught
    return true;
};
})();