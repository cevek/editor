//function a(...children:Child[]) {return dom('a', children)}
function abbr(...children:any[]) {return dom('abbr', children)}
function address(...children:any[]) {return dom('address', children)}
function area(...children:any[]) {return dom('area', children)}
function article(...children:any[]) {return dom('article', children)}
function aside(...children:any[]) {return dom('aside', children)}
function audio(...children:any[]) {return dom('audio', children)}
function b(...children:any[]) {return dom('b', children)}
function base(...children:any[]) {return dom('base', children)}
function bdi(...children:any[]) {return dom('bdi', children)}
function bdo(...children:any[]) {return dom('bdo', children)}
function big(...children:any[]) {return dom('big', children)}
function blockquote(...children:any[]) {return dom('blockquote', children)}
function body(...children:any[]) {return dom('body', children)}
function br(...children:any[]) {return dom('br', children)}
function button(...children:any[]) {return dom('button', children)}
function canvas(...children:any[]) {return dom('canvas', children)}
function caption(...children:any[]) {return dom('caption', children)}
function cite(...children:any[]) {return dom('cite', children)}
function code(...children:any[]) {return dom('code', children)}
function col(...children:any[]) {return dom('col', children)}
function colgroup(...children:any[]) {return dom('colgroup', children)}
function data(...children:any[]) {return dom('data', children)}
function datalist(...children:any[]) {return dom('datalist', children)}
function dd(...children:any[]) {return dom('dd', children)}
function del(...children:any[]) {return dom('del', children)}
function details(...children:any[]) {return dom('details', children)}
function dfn(...children:any[]) {return dom('dfn', children)}
function dialog(...children:any[]) {return dom('dialog', children)}
//function div(...children:Child[]) {return dom('div', children)}
function dl(...children:any[]) {return dom('dl', children)}
function dt(...children:any[]) {return dom('dt', children)}
function em(...children:any[]) {return dom('em', children)}
function embed(...children:any[]) {return dom('embed', children)}
function fieldset(...children:any[]) {return dom('fieldset', children)}
function figcaption(...children:any[]) {return dom('figcaption', children)}
function figure(...children:any[]) {return dom('figure', children)}
function footer(...children:any[]) {return dom('footer', children)}
function form(...children:any[]) {return dom('form', children)}
function h1(...children:any[]) {return dom('h1', children)}
function h2(...children:any[]) {return dom('h2', children)}
function h3(...children:any[]) {return dom('h3', children)}
function h4(...children:any[]) {return dom('h4', children)}
function h5(...children:any[]) {return dom('h5', children)}
function h6(...children:any[]) {return dom('h6', children)}
function head(...children:any[]) {return dom('head', children)}
function header(...children:any[]) {return dom('header', children)}
function hr(...children:any[]) {return dom('hr', children)}
function html(...children:any[]) {return dom('html', children)}
function i(...children:any[]) {return dom('i', children)}
function iframe(...children:any[]) {return dom('iframe', children)}
function img(...children:any[]) {return dom('img', children)}
function input(...children:any[]) {return dom('input', children)}
function ins(...children:any[]) {return dom('ins', children)}
function kbd(...children:any[]) {return dom('kbd', children)}
function keygen(...children:any[]) {return dom('keygen', children)}
function label(...children:any[]) {return dom('label', children)}
function legend(...children:any[]) {return dom('legend', children)}
function li(...children:any[]) {return dom('li', children)}
function link(...children:any[]) {return dom('link', children)}
function main(...children:any[]) {return dom('main', children)}
function map(...children:any[]) {return dom('map', children)}
function mark(...children:any[]) {return dom('mark', children)}
function menu(...children:any[]) {return dom('menu', children)}
function menuitem(...children:any[]) {return dom('menuitem', children)}
function meta(...children:any[]) {return dom('meta', children)}
function meter(...children:any[]) {return dom('meter', children)}
function nav(...children:any[]) {return dom('nav', children)}
function noscript(...children:any[]) {return dom('noscript', children)}
function object(...children:any[]) {return dom('object', children)}
function ol(...children:any[]) {return dom('ol', children)}
function optgroup(...children:any[]) {return dom('optgroup', children)}
function option(...children:any[]) {return dom('option', children)}
function output(...children:any[]) {return dom('output', children)}
function p(...children:any[]) {return dom('p', children)}
function param(...children:any[]) {return dom('param', children)}
function picture(...children:any[]) {return dom('picture', children)}
function pre(...children:any[]) {return dom('pre', children)}
function progress(...children:any[]) {return dom('progress', children)}
function q(...children:any[]) {return dom('q', children)}
function rp(...children:any[]) {return dom('rp', children)}
function rt(...children:any[]) {return dom('rt', children)}
function ruby(...children:any[]) {return dom('ruby', children)}
function s(...children:any[]) {return dom('s', children)}
function samp(...children:any[]) {return dom('samp', children)}
function script(...children:any[]) {return dom('script', children)}
function section(...children:any[]) {return dom('section', children)}
function select(...children:any[]) {return dom('select', children)}
function small(...children:any[]) {return dom('small', children)}
function source(...children:any[]) {return dom('source', children)}
//function span(...children:Child[]) {return dom('span', children)}
function strong(...children:any[]) {return dom('strong', children)}
function style(...children:any[]) {return dom('style', children)}
function sub(...children:any[]) {return dom('sub', children)}
function summary(...children:any[]) {return dom('summary', children)}
function sup(...children:any[]) {return dom('sup', children)}
function table(...children:any[]) {return dom('table', children)}
function tbody(...children:any[]) {return dom('tbody', children)}
function td(...children:any[]) {return dom('td', children)}
function textarea(...children:any[]) {return dom('textarea', children)}
function tfoot(...children:any[]) {return dom('tfoot', children)}
function th(...children:any[]) {return dom('th', children)}
function thead(...children:any[]) {return dom('thead', children)}
function time(...children:any[]) {return dom('time', children)}
function title(...children:any[]) {return dom('title', children)}
function tr(...children:any[]) {return dom('tr', children)}
function track(...children:any[]) {return dom('track', children)}
function u(...children:any[]) {return dom('u', children)}
function ul(...children:any[]) {return dom('ul', children)}
function video(...children:any[]) {return dom('video', children)}
function wbr(...children:any[]) {return dom('wbr', children)}
function dom(tag:string, children:any[]) {
    var node = <HTMLElement>document.createElement(tag);
    var children = flatArray(children);
    var firstChild = children[0];
    if (firstChild && typeof firstChild === 'object') {
        children.shift();
        var attrKeys = Object.keys(firstChild);
        for (var i = 0; i < attrKeys.length; i++) {
            var attr = attrKeys[i];
            node.setAttribute(attr, firstChild[attr]);
        }
    }
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child instanceof Node) {
            node.appendChild(<Node>child);
        }
        else {
            var textNode = render(child);
            node.appendChild(textNode);
        }
    }
    return node;
}

function flatArray(array:any[]) {
    var nodes = [];
    for (var i = 0; i < array.length; i++) {
        var child = array[i];
        if (child instanceof Array) {
            nodes = nodes.concat(flatArray(child));
        }
        else {
            nodes.push(child);
        }
    }
    return nodes;
}

function flatNodes(node:Node) {
    var nodes = [];
    if (node instanceof DocumentFragment) {
        var childNodes = node.childNodes;
        for (var i = 0; i < childNodes.length; i++) {
            var child = childNodes[i];
            if (child instanceof DocumentFragment) {
                nodes = nodes.concat(flatNodes(child));
            }
            else {
                nodes.push(child);
            }
        }
    }
    else {
        nodes.push(node);
    }
    return nodes;
}

function IF(condition:boolean, callback:()=>Node) {
    var node:Node;
    if (condition) {
        node = render(callback());
    }
    var nodes = flatNodes(node);
    return node;
}

function foreach<T>(array:T[], callback:(item:T, i:number)=>Node) {
    var nodes = [];
    var values = [];
    array = flatArray(array);
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < array.length; i++) {
        var item = array[i];
        var node = render(callback(item, i));
        fragment.appendChild(node);
        nodes.push(flatNodes(node));
        values.push(item);
    }
    (<any>fragment).__nodes = nodes;
    (<any>fragment).__values = values;
    (<any>fragment).__callback = callback;
    (<any>fragment).update = foreachUpdate;
    return fragment;
}

function render(node:any) {
    if (!(node instanceof Node)) {
        node = (typeof node === 'number' && node != +node) ? '' : node;
        node = (node === null || node === void 0) ? '' : node;
        node = document.createTextNode(node);
    }
    return node;
}

function foreachUpdate(newArray:any[]) {
    var nodes = this.__nodes;
    var values = this.__values;
    var callback = this.__callback;
    var fragment = <DocumentFragment>this;

    var newArray = flatArray(newArray);
    var newValues = [];
    var newNodes = [];
    var found = <{[index:number]:boolean}>{};
    for (var i = 0; i < newArray.length; i++) {
        var item = newArray[i];
        var index = values.indexOf(item);
        newValues.push(item);
        if (index > -1) {
            newNodes.push(nodes[index]);
            found[index] = true;
        }
        else {
            var node = render(callback(item, i));
            newNodes.push(flatNodes(node));
        }
    }

    var lastChild = <Node>nodes[nodes.length - 1][0];
    var afterLastChild = lastChild.nextSibling;
    var parent = lastChild.parentNode;
    if (parent) {
        for (var i = 0; i < nodes.length; i++) {
            if (!found[i]) {
                for (var j = 0; j < nodes[i].length; j++) {
                    var node = nodes[i][j];
                    parent.removeChild(node);
                }
            }
        }
        for (var i = 0; i < newNodes.length; i++) {
            for (var j = 0; j < newNodes[i].length; j++) {
                var node = newNodes[i][j];
                parent.insertBefore(node, afterLastChild);
            }
        }
    }

    (<any>fragment).__nodes = newNodes;
    (<any>fragment).__values = newValues;
}

var ff = foreach([1, [2, [3]], [[4], [[5]], [6, [7]], [8, [9], 0]]], (item)=>b({}, item));
document.body.appendChild(ff);
(<any>ff).update(["hello", i(0, false, "", null, void 0, 1 / 0, 1 / +"adsf", "pikapika")]);
//console.log(ff);
