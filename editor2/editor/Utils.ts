module editor {
    export const enum Pos{
        TOP, BOTTOM
    }

    export function getParents(target:Node, top:Node, includeTarget = true) {
        var node = target;
        var parents:HTMLElement[] = [];
        if (includeTarget) {
            parents.push(<HTMLElement>target);
        }
        while ((node = <HTMLElement>node.parentNode) && node != top) {
            parents.push(<HTMLElement>node);
        }
        return parents;
    }
}