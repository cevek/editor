class KeyPress {
[index: string]:boolean;
    noMod = true;
    shiftMod = false;
    shiftLeftMod = false;
    shiftRightMod = false;
    altMod = false;
    altLeftMod = false;
    altRightMod = false;
    ctrlMod = false;
    ctrlLeftMod = false;
    ctrlRightMod = false;
    metaMod = false;
    metaLeftMod = false;
    metaRightMod = false;
    backspace = false;
    tab = false;
    enter = false;
    space = false;
    shift = false;
    ctrl = false;
    alt = false;
    meta = false;
    pauseBreak = false;
    capsLock = false;
    escape = false;
    pageUp = false;
    pageDown = false;
    end = false;
    home = false;
    left = false;
    up = false;
    right = false;
    down = false;
    insert = false;
    delete = false;
    f1 = false;
    f2 = false;
    f3 = false;
    f4 = false;
    f5 = false;
    f6 = false;
    f7 = false;
    f8 = false;
    f9 = false;
    f10 = false;
    f11 = false;
    f12 = false;
    numLock = false;
    scrollLock = false;
    semiColon = false;
    equalSign = false;
    comma = false;
    dash = false;
    period = false;
    forwardSlash = false;
    graveAccent = false;
    openBracket = false;
    backSlash = false;
    closeBraket = false;
    singleQuote = false;
    metaLeft = false;
    metaRight = false;
    numpad0 = false;
    numpad1 = false;
    numpad2 = false;
    numpad3 = false;
    numpad4 = false;
    numpad5 = false;
    numpad6 = false;
    numpad7 = false;
    numpad8 = false;
    numpad9 = false;
    multiply = false;
    add = false;
    subtract = false;
    decimalPoint = false;
    divide = false;
    0 = false;
    1 = false;
    2 = false;
    3 = false;
    4 = false;
    5 = false;
    6 = false;
    7 = false;
    8 = false;
    9 = false;
    a = false;
    b = false;
    c = false;
    d = false;
    e = false;
    f = false;
    g = false;
    h = false;
    i = false;
    j = false;
    k = false;
    l = false;
    m = false;
    n = false;
    o = false;
    p = false;
    q = false;
    r = false;
    s = false;
    t = false;
    u = false;
    v = false;
    w = false;
    x = false;
    y = false;
    z = false;
    static keys = <{[index: number]:string}>{
        8: 'backspace',
        9: 'tab',
        13: 'enter',
        16: 'shift',
        17: 'ctrl',
        18: 'alt',
        19: 'pauseBreak',
        20: 'capsLock',
        27: 'escape',
        32: 'space',
        33: 'pageUp',
        34: 'pageDown',
        35: 'end',
        36: 'home',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        45: 'insert',
        46: 'delete',
        112: 'f1',
        113: 'f2',
        114: 'f3',
        115: 'f4',
        116: 'f5',
        117: 'f6',
        118: 'f7',
        119: 'f8',
        120: 'f9',
        121: 'f10',
        122: 'f11',
        123: 'f12',
        144: 'numLock',
        145: 'scrollLock',
        186: 'semiColon',
        187: 'equalSign',
        188: 'comma',
        189: 'dash',
        190: 'period',
        191: 'forwardSlash',
        192: 'graveAccent',
        219: 'openBracket',
        220: 'backSlash',
        221: 'closeBraket',
        222: 'singleQuote',
        91: 'metaLeft',
        92: 'metaRight',
        93: 'metaRight',
        96: 'numpad0',
        97: 'numpad1',
        98: 'numpad2',
        99: 'numpad3',
        100: 'numpad4',
        101: 'numpad5',
        102: 'numpad6',
        103: 'numpad7',
        104: 'numpad8',
        105: 'numpad9',
        106: 'multiply',
        107: 'add',
        109: 'subtract',
        110: 'decimalPoint',
        111: 'divide',
        48: '0',
        49: '1',
        50: '2',
        51: '3',
        52: '4',
        53: '5',
        54: '6',
        55: '7',
        56: '8',
        57: '9',
        65: 'a',
        66: 'b',
        67: 'c',
        68: 'd',
        69: 'e',
        70: 'f',
        71: 'g',
        72: 'h',
        73: 'i',
        74: 'j',
        75: 'k',
        76: 'l',
        77: 'm',
        78: 'n',
        79: 'o',
        80: 'p',
        81: 'q',
        82: 'r',
        83: 's',
        84: 't',
        85: 'u',
        86: 'v',
        87: 'w',
        88: 'x',
        89: 'y',
        90: 'z'
    };
    static shiftLeft = false;
    static ctrlLeft = false;
    static altLeft = false;
    static metaLeft = false;

    constructor(e:KeyboardEvent) {
        (<any>this)[KeyPress.keys[e.keyCode]] = true;
        if (this.metaLeft) {
            KeyPress.metaLeft = true;
            return;
        }
        if (this.metaRight) {
            KeyPress.metaLeft = false;
            return;
        }
        if (this.shift) {
            KeyPress.shiftLeft = e.location === 1;
            return;
        }
        if (this.ctrl) {
            KeyPress.ctrlLeft = e.location === 1;
            return;
        }
        if (this.alt) {
            KeyPress.altLeft = e.location === 1;
            return;
        }
        if (e.shiftKey) {
            this.noMod = false;
            this.shiftMod = true;
            this.shiftLeftMod = KeyPress.shiftLeft;
            this.shiftRightMod = !KeyPress.shiftLeft;
        }
        if (e.altKey) {
            this.noMod = false;
            this.altMod = true;
            this.altLeftMod = KeyPress.altLeft;
            this.altRightMod = !KeyPress.altLeft;
        }
        if (e.ctrlKey) {
            this.noMod = false;
            this.ctrlMod = true;
            this.ctrlLeftMod = KeyPress.ctrlLeft;
            this.ctrlRightMod = !KeyPress.ctrlLeft;
        }
        if (e.metaKey) {
            this.noMod = false;
            this.metaMod = true;
            this.metaLeftMod = KeyPress.metaLeft;
            this.metaRightMod = !KeyPress.metaLeft;
        }
        /*var keys = Object.keys(this);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (this[key]){
                console.log(key);
            }
        }*/
    }
}



