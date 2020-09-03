class Complier {
    private state: State

    public buffer = ''

    public currentEl: any

    public result = []

    constructor() {
        this.changeState(new TextState())
    }

    public compile(taggedTemplates: TemplateStringsArray, ...args) {
        const fields = arguments;

        for (const [i, str] of taggedTemplates.entries()) {
            for (const [j, char] of str.split('').entries()) {
                this.state.walk(char)
            }
        }
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

    public abstract walk(char: string): void
}

class TextState extends State {
    walk(char: string) {
        if (char === '<') {
            this.complier.currentEl && this.complier.result.push(this.complier.currentEl)
            this.complier.currentEl = {}
            this.complier.changeState(new TagNameState())
        } else {
            this.complier.buffer += char
        }
    }
}

class TagNameState extends State {
    walk(char: string) {
        if (char === ' ') {
            this.complier.currentEl.tag = this.complier.buffer
            this.complier.changeState(new TextState())
        } else {
            this.complier.buffer += char
        }
    }
}

class ElDefState extends State {
    walk(char: string) {

    }
}

const result = new Complier().compile`
<h1 id=hello>
    <div class="hello again">
        ${ (() => 'yes')()} Hello world!
    </div>
</h1>
<!-- comment -->
<div class=world>
    <${'component-tag'}>footer content<//>
    World!
</div>
`

console.log(result);
