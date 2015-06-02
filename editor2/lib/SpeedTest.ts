class FPSMeter {
    counter = 0;
    startTime = 0;
    fps = 0;

    update() {
        var now = Date.now();
        this.fps = 1000 / ((now - this.startTime) / this.counter) | 0;
        this.startTime = now;
        this.counter = 0;
    }

    constructor() {
        setInterval(()=>this.update(), 1000);
    }

    lap() {
        this.counter++;
    }
}
class SpeedTest extends virtual.Component<{}> {
    items:number[][] = [];
    counter = 0;
    fpsMeter = new FPSMeter();

    updateItems() {
        this.counter++;
        for (var i = 0; i < 150; i++) {
            this.items[i] = this.items[i] || [];
            for (var j = 0; j < 20; j++) {
                this.items[i][j] = this.counter + i + j;
            }
        }
        this.fpsMeter.lap();
        this.update();
        setTimeout(()=>this.updateItems());
    }

    componentWillMount() {
        this.updateItems();
    }

    render() {
        return this.root(
            vd('div', 'FPS:', this.fpsMeter.fps),
            vd('div',
                this.items.map(row =>
                        vd('div', row.map(cell =>
                            vd('div.inline', cell)))
                )
            )
        );
    }
}


class SpeedTestReact extends React.Component<{}, any> {
    items:number[][] = [];
    counter = 0;
    fpsMeter = new FPSMeter();

    updateItems() {
        this.counter++;
        for (var i = 0; i < 150; i++) {
            this.items[i] = this.items[i] || [];
            for (var j = 0; j < 20; j++) {
                this.items[i][j] = this.counter + i + j;
            }
        }
        this.fpsMeter.lap();
        this.forceUpdate();
        setTimeout(()=>this.updateItems());
    }

    componentWillMount() {
        console.log("componentWillMount");

        this.updateItems();
    }

    render() {
        return React.createElement('div', null,
            React.createElement('div', null, 'FPS:', this.fpsMeter.fps),
            this.items.map(row =>
                    React.createElement('div', null, row.map(cell =>
                        React.createElement('div', {className: 'inline'}, cell)))
            )
        );
    }
}
//React.render(React.createElement(SpeedTestReact, null), document.body);

setTimeout(() => {
    //new SpeedTest().init({}).mount(document.body);
});

