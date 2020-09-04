class Complier {
    constructor() {
        this.buffer = '';
        this.currentPropName = '';
        this.result = [];
        this.changeState(new TextState());
    }
    compile(taggedTemplates, ...args) {
        const fields = arguments;
        for (const [i, str] of taggedTemplates.entries()) {
            for (const [j, char] of str.split('').entries()) {
                this.state.walk(char, i, j, taggedTemplates);
            }
        }
        return this.result;
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
    addBuffer(char) {
        this.complier.buffer += char;
    }
    clearBuffer() {
        this.complier.buffer = '';
    }
}
/** 编写文本 */
class TextState extends State {
    walk(char, tindex, index, templates) {
        if (char === '<' && templates[tindex][index] === '/') {
            this.complier.changeState(new CloseTagState());
        }
        else if (char === '<') {
            this.saveBuffer();
            this.clearBuffer();
            const { currentEl: parentEl } = this.complier;
            this.complier.currentEl = {
                children: [],
                props: {}
            };
            if (parentEl) {
                parentEl.children.push(this.complier.currentEl);
            }
            else {
                this.complier.result.push(this.complier.currentEl);
            }
            this.complier.changeState(new TagNameState());
        }
        else {
            this.addBuffer(char);
        }
    }
    /**
     * 保存buffer为文本到元素中
     */
    saveBuffer() {
        let buffer = this.complier.buffer;
        buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g, '');
        if (buffer) {
            const { currentEl: parentEl } = this.complier;
            if (parentEl) {
                parentEl.children.push(buffer);
            }
            else {
                this.complier.result.push(buffer);
            }
        }
    }
}
/**
 * 命名标签
 */
class TagNameState extends State {
    walk(char) {
        if (char === ' ') {
            this.complier.currentEl.tag = this.complier.buffer;
            this.complier.changeState(new InsideElState());
            this.clearBuffer();
        }
        else {
            this.addBuffer(char);
        }
    }
}
class InsideElState extends State {
    walk(char) {
        const propName = this.complier.buffer.trim();
        if (char === ' ' && propName) {
            this.complier.currentEl.props[this.complier.buffer] = true;
            this.clearBuffer();
        }
        else if (char === '=' && propName) {
            this.complier.currentPropName = this.complier.buffer;
            this.complier.changeState(new DefPropState());
            this.clearBuffer();
        }
        else if (char === '>') {
            this.complier.changeState(new TextState());
            this.clearBuffer();
        }
        else {
            this.addBuffer(char);
        }
    }
}
class DefPropState extends State {
    walk(char) {
        if (char === ' ' || char === '>') {
            this.complier.currentEl.props[this.complier.currentPropName] = this.complier.buffer;
            char === ' ' && this.complier.changeState(new InsideElState());
            char === '>' && this.complier.changeState(new TextState());
            this.clearBuffer();
        }
        else {
            this.addBuffer(char);
        }
    }
}
class CloseTagState extends State {
    walk(char) {
        if (char === '>') {
            this.complier.changeState(new TextState());
            this.clearBuffer();
        }
        else {
            this.addBuffer(char);
        }
    }
}
const result = new Complier().compile `
<h1 id="hello">
    <div class="hello">
    hahahaha
    </div>
</h1>
`;
// const result = new Complier().compile`
// <h1 id=hello>
//     <div class="hello again">
//         ${ (() => 'yes')()} Hello world!
//     </div>
// </h1>
// <!-- comment -->
// <div class=world>
//     <${'component-tag'}>footer content<//>
//     World!
// </div>
// `
console.log(result);
//# sourceMappingURL=index.js.map