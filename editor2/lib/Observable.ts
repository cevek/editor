class Observable {
    private listeners:(()=>void)[] = [];

    changed() {
        for (var i = 0; i < this.listeners.length; i++) {
            var listener = this.listeners[i];
            listener();
        }
    }

    listen(callback:()=>void) {
        this.listeners.push(callback);
        return this;
    }

    unlisten(callback:()=>void) {
        var pos = this.listeners.indexOf(callback);
        if (pos > -1) {
            this.listeners.splice(pos, 1);
        }
    }
}