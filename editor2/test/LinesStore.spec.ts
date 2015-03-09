module test{
    var ls = new LinesStore();
    ls.push(new Line(
        new TextLine({start: 0, end: 0, text: '1'}),
        new TextLine({start: 0, end: 0, text: '1'})
    ));
    ls.push(new Line(
        new TextLine({start: 0, end: 0, text: '2'}),
        new TextLine({start: 0, end: 0, text: '2'})
    ));
    ls.push(new Line(
        new TextLine({start: 0, end: 0, text: '3'}),
        new TextLine({start: 0, end: 0, text: '3'})
    ));
    ls.push(new Line(
        new TextLine({start: 0, end: 0, text: '4'}),
        new TextLine({start: 0, end: 0, text: '4'})
    ));
    ls.push(new Line(
        new TextLine({start: 0, end: 0, text: '5'}),
        new TextLine({start: 0, end: 0, text: '5'})
    ));
}