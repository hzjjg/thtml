class Complier {
    constructor() {
        this.buffer = '';
        this.changeState(new TextState());
    }
    compile(taggedTemplates, ...args) {
        const fields = arguments;
        for (const [i, str] of taggedTemplates.entries()) {
            for (const [j, char] of str.split('').entries()) {
                this.state.walk(char);
            }
        }
    }
    changeState(state) {
        this.state = state;
        this.state.setComplier(this);
    }
}
class State {
    setComplier(context) {
        this.complier = context;
    }
}
class TextState extends State {
    walk(char) {
        if (char === '<') {
            this.complier.currentEle = {};
            this.complier.changeState(new TagNameState());
        }
        else {
            this.complier.buffer += char;
        }
    }
}
class TagNameState extends State {
    walk(char) {
        if (char === ' ') {
            this.complier.currentEle.tag = this.complier.buffer;
            this.complier.changeState(new TextState());
        }
        else {
            this.complier.buffer += char;
        }
    }
}
const result = new Complier().compile `
<h1 id=hello>
    <div class="hello again">
        ${(() => 'yes')()} Hello world!
    </div>
</h1>
<!-- comment -->
<div class=world>
    <${'component-tag'}>footer content<//>
    World!
</div>
`;
console.log(result);
//# sourceMappingURL=index.js.map