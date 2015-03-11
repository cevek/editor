type BaseChild0 = string | number | Node;
type BaseChild1 = string | number | Node | BaseChild0[];
type BaseChild2 = string | number | Node | BaseChild1[];
type BaseChild3 = string | number | Node | BaseChild2[];
type Child = string | number | Node | BaseChild3[];

function a(attrs:Object, ...children:Child[]) {return dom('a', attrs, children)}
function abbr(attrs:Object, ...children:Child[]) {return dom('abbr', attrs, children)}
function address(attrs:Object, ...children:Child[]) {return dom('address', attrs, children)}
function area(attrs:Object, ...children:Child[]) {return dom('area', attrs, children)}
function article(attrs:Object, ...children:Child[]) {return dom('article', attrs, children)}
function aside(attrs:Object, ...children:Child[]) {return dom('aside', attrs, children)}
function audio(attrs:Object, ...children:Child[]) {return dom('audio', attrs, children)}
function b(attrs:Object, ...children:Child[]) {return dom('b', attrs, children)}
function base(attrs:Object, ...children:Child[]) {return dom('base', attrs, children)}
function bdi(attrs:Object, ...children:Child[]) {return dom('bdi', attrs, children)}
function bdo(attrs:Object, ...children:Child[]) {return dom('bdo', attrs, children)}
function big(attrs:Object, ...children:Child[]) {return dom('big', attrs, children)}
function blockquote(attrs:Object, ...children:Child[]) {return dom('blockquote', attrs, children)}
function body(attrs:Object, ...children:Child[]) {return dom('body', attrs, children)}
function br(attrs:Object, ...children:Child[]) {return dom('br', attrs, children)}
function button(attrs:Object, ...children:Child[]) {return dom('button', attrs, children)}
function canvas(attrs:Object, ...children:Child[]) {return dom('canvas', attrs, children)}
function caption(attrs:Object, ...children:Child[]) {return dom('caption', attrs, children)}
function cite(attrs:Object, ...children:Child[]) {return dom('cite', attrs, children)}
function code(attrs:Object, ...children:Child[]) {return dom('code', attrs, children)}
function col(attrs:Object, ...children:Child[]) {return dom('col', attrs, children)}
function colgroup(attrs:Object, ...children:Child[]) {return dom('colgroup', attrs, children)}
function data(attrs:Object, ...children:Child[]) {return dom('data', attrs, children)}
function datalist(attrs:Object, ...children:Child[]) {return dom('datalist', attrs, children)}
function dd(attrs:Object, ...children:Child[]) {return dom('dd', attrs, children)}
function del(attrs:Object, ...children:Child[]) {return dom('del', attrs, children)}
function details(attrs:Object, ...children:Child[]) {return dom('details', attrs, children)}
function dfn(attrs:Object, ...children:Child[]) {return dom('dfn', attrs, children)}
function dialog(attrs:Object, ...children:Child[]) {return dom('dialog', attrs, children)}
function div(attrs:Object, ...children:Child[]) {return dom('div', attrs, children)}
function dl(attrs:Object, ...children:Child[]) {return dom('dl', attrs, children)}
function dt(attrs:Object, ...children:Child[]) {return dom('dt', attrs, children)}
function em(attrs:Object, ...children:Child[]) {return dom('em', attrs, children)}
function embed(attrs:Object, ...children:Child[]) {return dom('embed', attrs, children)}
function fieldset(attrs:Object, ...children:Child[]) {return dom('fieldset', attrs, children)}
function figcaption(attrs:Object, ...children:Child[]) {return dom('figcaption', attrs, children)}
function figure(attrs:Object, ...children:Child[]) {return dom('figure', attrs, children)}
function footer(attrs:Object, ...children:Child[]) {return dom('footer', attrs, children)}
function form(attrs:Object, ...children:Child[]) {return dom('form', attrs, children)}
function h1(attrs:Object, ...children:Child[]) {return dom('h1', attrs, children)}
function h2(attrs:Object, ...children:Child[]) {return dom('h2', attrs, children)}
function h3(attrs:Object, ...children:Child[]) {return dom('h3', attrs, children)}
function h4(attrs:Object, ...children:Child[]) {return dom('h4', attrs, children)}
function h5(attrs:Object, ...children:Child[]) {return dom('h5', attrs, children)}
function h6(attrs:Object, ...children:Child[]) {return dom('h6', attrs, children)}
function head(attrs:Object, ...children:Child[]) {return dom('head', attrs, children)}
function header(attrs:Object, ...children:Child[]) {return dom('header', attrs, children)}
function hr(attrs:Object, ...children:Child[]) {return dom('hr', attrs, children)}
function html(attrs:Object, ...children:Child[]) {return dom('html', attrs, children)}
function i(attrs:Object, ...children:Child[]) {return dom('i', attrs, children)}
function iframe(attrs:Object, ...children:Child[]) {return dom('iframe', attrs, children)}
function img(attrs:Object, ...children:Child[]) {return dom('img', attrs, children)}
function input(attrs:Object, ...children:Child[]) {return dom('input', attrs, children)}
function ins(attrs:Object, ...children:Child[]) {return dom('ins', attrs, children)}
function kbd(attrs:Object, ...children:Child[]) {return dom('kbd', attrs, children)}
function keygen(attrs:Object, ...children:Child[]) {return dom('keygen', attrs, children)}
function label(attrs:Object, ...children:Child[]) {return dom('label', attrs, children)}
function legend(attrs:Object, ...children:Child[]) {return dom('legend', attrs, children)}
function li(attrs:Object, ...children:Child[]) {return dom('li', attrs, children)}
function link(attrs:Object, ...children:Child[]) {return dom('link', attrs, children)}
function main(attrs:Object, ...children:Child[]) {return dom('main', attrs, children)}
function map(attrs:Object, ...children:Child[]) {return dom('map', attrs, children)}
function mark(attrs:Object, ...children:Child[]) {return dom('mark', attrs, children)}
function menu(attrs:Object, ...children:Child[]) {return dom('menu', attrs, children)}
function menuitem(attrs:Object, ...children:Child[]) {return dom('menuitem', attrs, children)}
function meta(attrs:Object, ...children:Child[]) {return dom('meta', attrs, children)}
function meter(attrs:Object, ...children:Child[]) {return dom('meter', attrs, children)}
function nav(attrs:Object, ...children:Child[]) {return dom('nav', attrs, children)}
function noscript(attrs:Object, ...children:Child[]) {return dom('noscript', attrs, children)}
function object(attrs:Object, ...children:Child[]) {return dom('object', attrs, children)}
function ol(attrs:Object, ...children:Child[]) {return dom('ol', attrs, children)}
function optgroup(attrs:Object, ...children:Child[]) {return dom('optgroup', attrs, children)}
function option(attrs:Object, ...children:Child[]) {return dom('option', attrs, children)}
function output(attrs:Object, ...children:Child[]) {return dom('output', attrs, children)}
function p(attrs:Object, ...children:Child[]) {return dom('p', attrs, children)}
function param(attrs:Object, ...children:Child[]) {return dom('param', attrs, children)}
function picture(attrs:Object, ...children:Child[]) {return dom('picture', attrs, children)}
function pre(attrs:Object, ...children:Child[]) {return dom('pre', attrs, children)}
function progress(attrs:Object, ...children:Child[]) {return dom('progress', attrs, children)}
function q(attrs:Object, ...children:Child[]) {return dom('q', attrs, children)}
function rp(attrs:Object, ...children:Child[]) {return dom('rp', attrs, children)}
function rt(attrs:Object, ...children:Child[]) {return dom('rt', attrs, children)}
function ruby(attrs:Object, ...children:Child[]) {return dom('ruby', attrs, children)}
function s(attrs:Object, ...children:Child[]) {return dom('s', attrs, children)}
function samp(attrs:Object, ...children:Child[]) {return dom('samp', attrs, children)}
function script(attrs:Object, ...children:Child[]) {return dom('script', attrs, children)}
function section(attrs:Object, ...children:Child[]) {return dom('section', attrs, children)}
function select(attrs:Object, ...children:Child[]) {return dom('select', attrs, children)}
function small(attrs:Object, ...children:Child[]) {return dom('small', attrs, children)}
function source(attrs:Object, ...children:Child[]) {return dom('source', attrs, children)}
function span(attrs:Object, ...children:Child[]) {return dom('span', attrs, children)}
function strong(attrs:Object, ...children:Child[]) {return dom('strong', attrs, children)}
function style(attrs:Object, ...children:Child[]) {return dom('style', attrs, children)}
function sub(attrs:Object, ...children:Child[]) {return dom('sub', attrs, children)}
function summary(attrs:Object, ...children:Child[]) {return dom('summary', attrs, children)}
function sup(attrs:Object, ...children:Child[]) {return dom('sup', attrs, children)}
function table(attrs:Object, ...children:Child[]) {return dom('table', attrs, children)}
function tbody(attrs:Object, ...children:Child[]) {return dom('tbody', attrs, children)}
function td(attrs:Object, ...children:Child[]) {return dom('td', attrs, children)}
function textarea(attrs:Object, ...children:Child[]) {return dom('textarea', attrs, children)}
function tfoot(attrs:Object, ...children:Child[]) {return dom('tfoot', attrs, children)}
function th(attrs:Object, ...children:Child[]) {return dom('th', attrs, children)}
function thead(attrs:Object, ...children:Child[]) {return dom('thead', attrs, children)}
function time(attrs:Object, ...children:Child[]) {return dom('time', attrs, children)}
function title(attrs:Object, ...children:Child[]) {return dom('title', attrs, children)}
function tr(attrs:Object, ...children:Child[]) {return dom('tr', attrs, children)}
function track(attrs:Object, ...children:Child[]) {return dom('track', attrs, children)}
function u(attrs:Object, ...children:Child[]) {return dom('u', attrs, children)}
function ul(attrs:Object, ...children:Child[]) {return dom('ul', attrs, children)}
function video(attrs:Object, ...children:Child[]) {return dom('video', attrs, children)}
function wbr(attrs:Object, ...children:Child[]) {return dom('wbr', attrs, children)}
function dom(tag:string, attrs:Object, children:Child[]) {
    var node = <HTMLElement>document.createElement(tag);
    var attrKeys = Object.keys(attrs);
    for (var i = 0; i < attrKeys.length; i++) {
        var attr = attrKeys[i];
        node.setAttribute(attr, attrs[attr]);
    }
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (typeof child === 'string' || typeof child === 'number') {
            var textNode = document.createTextNode(child + '');
            node.appendChild(textNode);
        }
        else {
            node.appendChild(<Node>child);
        }
    }
    return node;
}