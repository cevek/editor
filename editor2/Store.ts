interface Iterable<T> {
    [index:number]: T;
    length: number;
}

class List<T> {
    constructor(array?:Iterable<T>) {
        if (array) {
            for (var i = 0; i < array.length; i++) {
                this[i] = array[i];
            }
            this.length = array.length;
        }
    }

    get(index:number) {
        return this[index];
    }

    set(index:number, value:T) {
        this[index] = value;
        if (this.length < index + 1) {
            this.length = index + 1;
        }
    }

    isEmpty() {
        
        return this.length === 0;
    }

    isNotEmpty() {
        
        return this.length > 0;
    }

    clear() {
        
        while (this.length) this.pop();
    }

    remove(item:T) {
        
        var pos = this.indexOf(item);
        if (pos > -1) {
            this.splice(pos, 1);
        }
    }

    replace(array:Iterable<T>) {
        for (var i = 0; i < array.length; i++) {
            this[i] = array[i];
        }
        for (var i = array.length; i < this.length; i++) {
            this[i] = null;
        }
        this.length = array.length;
    }

    concat<U extends List<T>>(...items:U[]):List<T>;
    concat(...items:T[]) {
        
        return new List<T>(Array.prototype.concat.apply(this, items))
    }

    join(separator?:string):string {
        
        return Array.prototype.join.call(this, separator)
    }

    pop():T {

        var ret = Array.prototype.pop.call(this);

        return ret;
    }

    push(...items:T[]):number {
        
        var ret = Array.prototype.push.apply(this, items);

        return ret;
    }

    reverse() {
        
        var ret = Array.prototype.reverse.call(this);

        return this;
    }

    shift():T {
        
        var ret = Array.prototype.shift.call(this);

        return ret;
    }

    slice(start?:number, end?:number):List<T> {
        
        var ret = Array.prototype.slice.call(this, start, end);
        return new List<T>(ret);
    }

    toArray() {
        
        return Array.prototype.slice.call(this);
    }

    sort(compareFn?:(a:T, b:T) => number) {
        
        var ret = Array.prototype.sort.call(this, compareFn);

        return this;
    }

    splice(start:number, deleteCount?:number, ...items:T[]) {
        
        var ret = Array.prototype.splice.apply(this, arguments);

        return this;
    }

    unshift(...items:T[]):number {
        
        var ret = Array.prototype.unshift.apply(this, items);

        return ret;
    }

    indexOf(searchElement:T, fromIndex?:number):number {
        
        return Array.prototype.indexOf.call(this, searchElement, fromIndex)
    }

    lastIndexOf(searchElement:T, fromIndex?:number):number {
        
        return Array.prototype.lastIndexOf.call(this, searchElement, fromIndex)
    }

    every(callbackfn:(value:T, index:number, array:List<T>) => boolean, thisArg?:any):boolean {
        
        return Array.prototype.every.call(this, callbackfn, thisArg)
    }

    some(callbackfn:(value:T, index:number, array:List<T>) => boolean, thisArg?:any):boolean {
        
        return Array.prototype.some.call(this, callbackfn, thisArg)
    }

    forEach(callbackfn:(value:T, index:number, array:List<T>) => void, thisArg?:any):void {
        
        return Array.prototype.forEach.call(this, callbackfn, thisArg)
    }

    map<U>(callbackfn:(value:T, index:number, array:List<T>) => U, thisArg?:any):List<U> {
        
        return Array.prototype.map.call(this, callbackfn, thisArg)
    }

    filter(callbackfn:(value:T, index:number, array:List<T>) => boolean, thisArg?:any):List<T> {
        return Array.prototype.filter.call(this, callbackfn, thisArg);
    }

    reduce(callbackfn:(prevVal:T, curVal:T, curIndex:number, array:List<T>) => T, inVal?:T):T;
    reduce<U>(callbackfn:(prevVal:U, curVal:T, curIndex:number, array:List<T>) => U, inVal:U):U {
        
        return Array.prototype.reduce.call(this, callbackfn, inVal)
    }

    reduceRight(callbackfn:(prevVal:T, curVal:T, curIndex:number, array:List<T>) => T, inVal?:T):T;
    reduceRight<U>(callbackfn:(prevVal:U, curVal:T, curIndex:number, array:List<T>) => U, inVal:U):U {
        
        return Array.prototype.reduceRight.call(this, callbackfn, inVal)
    }

    length = 0;
[n: number]: T;
}
