class Complier {
    private state: State

    public buffer = ''

    public currentEl: { tag?: string, props?: any, children?: any[] }

    public currentPropName = ''

    public result = []

    constructor() {
        this.changeState(new TextState())
    }

    public compile(taggedTemplates: TemplateStringsArray, ...args) {
        const fields = arguments;

        for (const [i, str] of taggedTemplates.entries()) {
            for (const [j, char] of str.split('').entries()) {
                this.state.walk(char, i, j, taggedTemplates)
            }
        }

        return this.result
    }

    public changeState(state: State) {
        this.state = state;
        this.state.setComplier(this)
    }
}

abstract class State {
    protected complier: Complier

    public setComplier(context: Complier) {
        this.complier = context
    }

    /**
     * 
     * @param char 当前字符
     * @param tIndex 当前标签模板字符串的index
     * @param index 字符在当前字符串index
     * @param templates 带标签的模板字符串
     */
    public abstract walk(char: string, tIndex?: number, index?: number, templates?: TemplateStringsArray): void

    protected addBuffer(char) {
        this.complier.buffer += char
    }

    protected clearBuffer() {
        this.complier.buffer = ''
    }
}

/** 编写文本 */
class TextState extends State {
    walk(char: string, tindex, index, templates) {
        if (char === '<' && templates[tindex][index] === '/') {
            this.complier.changeState(new CloseTagState())
        }
        else if (char === '<') {
            this.saveBuffer()
            this.clearBuffer()

            const { currentEl: parentEl } = this.complier
            this.complier.currentEl = {
                children: [],
                props: {}
            };

            if (parentEl) {
                parentEl.children.push(this.complier.currentEl)
            } else {
                this.complier.result.push(this.complier.currentEl)
            }
            this.complier.changeState(new TagNameState())
        } else {
            this.addBuffer(char)
        }
    }

    /**
     * 保存buffer为文本到元素中
     */
    saveBuffer() {
        let buffer = this.complier.buffer;
        buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g, '')
        if (buffer) {
            const { currentEl: parentEl } = this.complier
            if (parentEl) {
                parentEl.children.push(buffer)
            } else {
                this.complier.result.push(buffer)
            }
        }
    }
}

/**
 * 命名标签
 */
class TagNameState extends State {
    walk(char: string) {
        if (char === ' ') {
            this.complier.currentEl.tag = this.complier.buffer
            this.complier.changeState(new InsideElState())
            this.clearBuffer()
        } else {
            this.addBuffer(char)
        }
    }
}

class InsideElState extends State {
    walk(char: string) {
        const propName = this.complier.buffer.trim()
        if (char === ' ' && propName) {
            this.complier.currentEl.props[this.complier.buffer] = true
            this.clearBuffer()
        }
        else if (char === '=' && propName) {
            this.complier.currentPropName = this.complier.buffer
            this.complier.changeState(new DefPropState())
            this.clearBuffer();
        }
        else if (char === '>') {
            this.complier.changeState(new TextState())
            this.clearBuffer()
        }
        else {
            this.addBuffer(char)
        }
    }
}

class DefPropState extends State {
    walk(char: string) {
        if (char === ' ' || char === '>') {
            this.complier.currentEl.props[this.complier.currentPropName] = this.complier.buffer
            char === ' ' && this.complier.changeState(new InsideElState())
            char === '>' && this.complier.changeState(new TextState())
            this.clearBuffer()
        }
        else {
            this.addBuffer(char)
        }
    }
}

class CloseTagState extends State {
    walk(char: string) {
        if (char === '>') {
            this.complier.changeState(new TextState())
            this.clearBuffer()
        } else {
            this.addBuffer(char)
        }
    }
}

const result = new Complier().compile`
<h1 id="hello">
    <div class="hello">
    hahahaha
    </div>
</h1>
`

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
