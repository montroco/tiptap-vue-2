import Vue, { Component } from 'vue';
import { Editor } from './Editor.js';
export interface EditorContentInterface extends Vue {
    editor: Editor;
}
export declare const EditorContent: Component;
