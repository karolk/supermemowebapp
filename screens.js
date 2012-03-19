(function() {
'use strict';
function doTemplate(stash) {
    for (var key in stash) {
        var $templElems = $(this).find('[data-templ="'+key+'"]'),
            $attrElems = $(this).find('[data-attr="'+key+'"]'),
            $bindElems = $(this).find('[data-bind="'+key+'"]');
        $templElems.each(function(i, node) {
            $(node).text(stash[key]);
        });
        $attrElems.each(function(i, node) {
            $(node).attr(key, stash[key]);
        });
        $bindElems.each(function(i, node) {
            $(node).dataObj(key, stash[key]);
        });
    }
    return this;
}

var storage = []

$.fn.dataObj = function(key, valueObj) {
    
    var node = this,
        ret;
    
    if (key && valueObj) {
        var row;
        storage.forEach(function(r) {
            if (r[0]===node[0]) {
                row = r;
            }
        })
        if (!row) {
            row = [node[0]]
        }
        
        var dataObj = {}
        dataObj[key] = valueObj;
        row.push(dataObj)
        
        storage.push(row);
        
        return node;
        
    }
    
    storage.forEach(function(row) {
        if ( row[0]===node[0] ) {
            if (key && row[1].hasOwnProperty(key)) {
                ret = row[1][key];
                return;
            }
            else {
                ret = row[1];
                return;
            }
        }
    });
    
    return ret;

}

$.fn.template = function(stash) {

    var rootNode = this,
        expectCollection = this.is('select, ol, ul'),
        stencilSelector = {
            select: 'option',
            ol: 'li',
            ul: 'li',
            dl: 'dt, dd', //a bit simple
            table: 'tr',
        },
        stencil;
        
    if (expectCollection) {
        
        stencil = rootNode.children( stencilSelector[ this[0].tagName ] );
        
        if (stencil.length) {
            stencil = stencil[0].cloneNode(true)
            rootNode.empty();
            stash.forEach(function(stashElem) {
                rootNode.append(
                    doTemplate.call(
                        stencil.cloneNode(true),
                        stashElem
                    )
                );
            });
        }
        else {
            console.warn('No stencil found')
        }
    }
    else {
        doTemplate.call(rootNode, stash)
    }
    
    return rootNode;
    
}

})();