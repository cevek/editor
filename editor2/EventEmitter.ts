class EventEmitter<T> {
    private listeners:((data:T)=>void)[] = [];

    emit(val?:T) {
        for (var i = 0; i < this.listeners.length; i++) {
            var listener = this.listeners[i];
            listener(val);
        }
    }

    listen(callback:(data:T)=>void) {
        this.listeners.push(callback);
        return this;
    }

    unlisten(callback:(data:T)=>void) {
        var pos = this.listeners.indexOf(callback);
        if (pos > -1) {
            this.listeners.splice(pos, 1);
        }
    }
}