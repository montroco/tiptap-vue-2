'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var core = require('@tiptap/core');
var Vue = require('vue');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var Vue__default = /*#__PURE__*/_interopDefaultLegacy(Vue);

class Editor extends core.Editor {
    constructor() {
        super(...arguments);
        this.contentComponent = null;
    }
}

const EditorContent = {
    name: 'EditorContent',
    props: {
        editor: {
            default: null,
            type: Object,
        },
    },
    watch: {
        editor: {
            immediate: true,
            handler(editor) {
                if (editor && editor.options.element) {
                    this.$nextTick(() => {
                        const element = this.$el;
                        if (!element || !editor.options.element.firstChild) {
                            return;
                        }
                        element.append(...editor.options.element.childNodes);
                        editor.contentComponent = this;
                        editor.setOptions({
                            element,
                        });
                        editor.createNodeViews();
                    });
                }
            },
        },
    },
    render(createElement) {
        return createElement('div');
    },
    beforeDestroy() {
        const { editor } = this;
        if (!editor) {
            return;
        }
        if (!editor.isDestroyed) {
            editor.view.setProps({
                nodeViews: {},
            });
        }
        editor.contentComponent = null;
        if (!editor.options.element.firstChild) {
            return;
        }
        const newElement = document.createElement('div');
        newElement.append(...editor.options.element.childNodes);
        editor.setOptions({
            element: newElement,
        });
    },
};

const NodeViewContent = {
    props: {
        as: {
            type: String,
            default: 'div',
        },
    },
    render(createElement) {
        return createElement(this.as, {
            style: {
                whiteSpace: 'pre-wrap',
            },
            attrs: {
                'data-node-view-content': '',
            },
        });
    },
};

const NodeViewWrapper = {
    props: {
        as: {
            type: String,
            default: 'div',
        },
    },
    inject: ['onDragStart', 'decorationClasses'],
    render(createElement) {
        return createElement(this.as, {
            class: this.decorationClasses.value,
            style: {
                whiteSpace: 'normal',
            },
            attrs: {
                'data-node-view-wrapper': '',
            },
            on: {
                dragstart: this.onDragStart,
            },
        }, this.$slots.default);
    },
};

class VueRenderer {
    constructor(component, props) {
        const Component = (typeof component === 'function') ? component : Vue__default["default"].extend(component);
        this.ref = new Component(props).$mount();
    }
    get element() {
        return this.ref.$el;
    }
    updateProps(props = {}) {
        var _a, _b, _c;
        if (!this.ref.$props) {
            return;
        }
        // prevents `Avoid mutating a prop directly` error message
        // Fix: `VueNodeViewRenderer` change vue Constructor `config.silent` not working
        const currentVueConstructor = (_c = (_b = (_a = this.ref.$props.editor) === null || _a === void 0 ? void 0 : _a.contentComponent) === null || _b === void 0 ? void 0 : _b.$options._base) !== null && _c !== void 0 ? _c : Vue__default["default"]; // eslint-disable-line
        const originalSilent = currentVueConstructor.config.silent;
        currentVueConstructor.config.silent = true;
        Object
            .entries(props)
            .forEach(([key, value]) => {
            this.ref.$props[key] = value;
        });
        currentVueConstructor.config.silent = originalSilent;
    }
    destroy() {
        this.ref.$destroy();
    }
}

const nodeViewProps = {
    editor: {
        type: Object,
        required: true,
    },
    node: {
        type: Object,
        required: true,
    },
    decorations: {
        type: Object,
        required: true,
    },
    selected: {
        type: Boolean,
        required: true,
    },
    extension: {
        type: Object,
        required: true,
    },
    getPos: {
        type: Function,
        required: true,
    },
    updateAttributes: {
        type: Function,
        required: true,
    },
    deleteNode: {
        type: Function,
        required: true,
    },
};
class VueNodeView extends core.NodeView {
    mount() {
        var _a, _b;
        const props = {
            editor: this.editor,
            node: this.node,
            decorations: this.decorations,
            selected: false,
            extension: this.extension,
            getPos: () => this.getPos(),
            updateAttributes: (attributes = {}) => this.updateAttributes(attributes),
            deleteNode: () => this.deleteNode(),
        };
        const onDragStart = this.onDragStart.bind(this);
        this.decorationClasses = Vue__default["default"].observable({
            value: this.getDecorationClasses(),
        });
        // @ts-ignore
        const vue = (_b = (_a = this.editor.contentComponent) === null || _a === void 0 ? void 0 : _a.$options._base) !== null && _b !== void 0 ? _b : Vue__default["default"]; // eslint-disable-line
        const Component = vue.extend(this.component).extend({
            props: Object.keys(props),
            provide: () => {
                return {
                    onDragStart,
                    decorationClasses: this.decorationClasses,
                };
            },
        });
        this.renderer = new VueRenderer(Component, {
            parent: this.editor.contentComponent,
            propsData: props,
        });
    }
    get dom() {
        if (!this.renderer.element.hasAttribute('data-node-view-wrapper')) {
            throw Error('Please use the NodeViewWrapper component for your node view.');
        }
        return this.renderer.element;
    }
    get contentDOM() {
        if (this.node.isLeaf) {
            return null;
        }
        const contentElement = this.dom.querySelector('[data-node-view-content]');
        return (contentElement || this.dom);
    }
    update(node, decorations) {
        const updateProps = (props) => {
            this.decorationClasses.value = this.getDecorationClasses();
            this.renderer.updateProps(props);
        };
        if (typeof this.options.update === 'function') {
            const oldNode = this.node;
            const oldDecorations = this.decorations;
            this.node = node;
            this.decorations = decorations;
            return this.options.update({
                oldNode,
                oldDecorations,
                newNode: node,
                newDecorations: decorations,
                updateProps: () => updateProps({ node, decorations }),
            });
        }
        if (node.type !== this.node.type) {
            return false;
        }
        if (node === this.node && this.decorations === decorations) {
            return true;
        }
        this.node = node;
        this.decorations = decorations;
        updateProps({ node, decorations });
        return true;
    }
    selectNode() {
        this.renderer.updateProps({
            selected: true,
        });
    }
    deselectNode() {
        this.renderer.updateProps({
            selected: false,
        });
    }
    getDecorationClasses() {
        return (this.decorations
            // @ts-ignore
            .map(item => item.type.attrs.class)
            .flat()
            .join(' '));
    }
    destroy() {
        this.renderer.destroy();
    }
}
function VueNodeViewRenderer(component, options) {
    return (props) => {
        // try to get the parent component
        // this is important for vue devtools to show the component hierarchy correctly
        // maybe it’s `undefined` because <editor-content> isn’t rendered yet
        if (!props.editor.contentComponent) {
            return {};
        }
        return new VueNodeView(component, props, options);
    };
}

exports.Editor = Editor;
exports.EditorContent = EditorContent;
exports.NodeViewContent = NodeViewContent;
exports.NodeViewWrapper = NodeViewWrapper;
exports.VueNodeViewRenderer = VueNodeViewRenderer;
exports.VueRenderer = VueRenderer;
exports.nodeViewProps = nodeViewProps;
Object.keys(core).forEach(function (k) {
  if (k !== 'default' && !exports.hasOwnProperty(k)) Object.defineProperty(exports, k, {
    enumerable: true,
    get: function () { return core[k]; }
  });
});
//# sourceMappingURL=index.cjs.map
