module control {
    export class Tabs extends virtual.Component<{value?:observer.Atom<Object>}> {
        @observe active:Object = null;
        titles:string[] = [];
        values:Object[] = [];
        content:virtual.Child;

        constructor(public value?:observer.Atom<Object>) {
            super();
        }

        componentWillMount() {
            if (this.value) {
                observer.Atom.from(this.active).sync(this.value);
            }
        }

        getChildrenTabs() {
            this.titles = [];
            this.values = [];
            var firstTab:Tab = null;
            this.children.forEach(child => {
                if (child instanceof virtual.VNode && child.component instanceof Tab) {
                    var tab = <Tab>child.component;
                    this.titles.push(tab.props.title);
                    this.values.push(tab.props.value);
                    if (this.active == null && tab.props.isDefault) {
                        this.active = tab.props.value;
                    }
                    if (tab.props.value == this.active) {
                        this.content = tab.rootNode;
                    }
                    if (!firstTab) {
                        firstTab = tab;
                    }
                }
            });
            if (this.active == null && firstTab) {
                this.active = this.values[0];
                this.content = firstTab.rootNode;
            }
        }

        render() {
            this.getChildrenTabs();
            return this.root(
                this.titles.map((m, i) =>
                        vd('button', {
                            classes: {active: this.values[i] == this.active},
                            type: 'button',
                            onclick: ()=>this.active = this.values[i]
                        }, m)
                ),
                this.content
            )
        }
    }

    export class Tab extends virtual.Component<{title:string; value?:any; isDefault?:boolean}> {
        render() {
            return this.root(this.children);
        }
    }
}