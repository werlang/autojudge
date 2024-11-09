import Modal from './modal.js';
import Form from './form.js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Text from '@tiptap/extension-text';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import Document from '@tiptap/extension-document';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';

export default class TextEditor {
    constructor({ mode, element, content } = {}) {
        this.mode = mode || 'html';

        if (!element) {
            throw new Error('Element is required');
        }
        this.element = element;

        this.content = content || element.innerHTML;

        this.build();
    }

    build() {
        const extensions = [];
        
        if (this.mode === 'text') {
            // Create a custom document node
            const CustomDocument = Document.extend({
                content: 'text*', // Allow only text nodes
            });

            extensions.push(
                CustomDocument,
                Text,
            );
        }
        else if (this.mode === 'html') {
            extensions.push(
                StarterKit,
                Underline,
                TextAlign.configure({
                    types: ['heading', 'paragraph', 'image'],
                }),
                Image.configure({
                    inline: true,
                    allowBase64: true,
                }),
                Link.configure({
                    openOnClick: false,
                }),
                BubbleMenu.configure({
                    pluginKey: 'bubbleMenuText',
                    element: this.createBubbleMenu(),
                    // shouldShow: ({ editor }) => !editor.isActive('image')
                }),
            );
        }

        const editor = new Editor({
            element: this.element,
            extensions,
            content: this.content,
            editable: true,
            autofocus: true,
            parseOptions: { preserveWhitespace: 'full' },
        });
        this.editor = editor;

        // Update the field content when the editor updates
        editor.on('update', () => {
            if (this.mode === 'text') {
                this.content = editor.getText(); // Use getText() to avoid tags
            }
            else if (this.mode === 'html') {
                this.content = editor.getHTML();
            }
        });
    }

    createBubbleMenu() {
        if (this.element.querySelector('.bubble-menu')) return;

        const bubbleMenu = document.createElement('div');
        bubbleMenu.classList.add('bubble-menu');
        this.element.appendChild(bubbleMenu);

        const self = this;
        function createActionButton(id, icon, callback) {
            const button = document.createElement('button');
            button.id = id;
            button.innerHTML = `<i class="fas fa-${icon}"></i>`;
            button.addEventListener('click', callback);
            return button;
        }

        bubbleMenu.appendChild(createActionButton('bold', 'bold', () => this.editor.chain().focus().toggleBold().run()));
        bubbleMenu.appendChild(createActionButton('italic', 'italic', () => this.editor.chain().focus().toggleItalic().run()));
        bubbleMenu.appendChild(createActionButton('underline', 'underline', () => this.editor.chain().focus().toggleUnderline().run()));
        bubbleMenu.appendChild(createActionButton('strike', 'strikethrough', () => this.editor.chain().focus().toggleStrike().run()));
        bubbleMenu.appendChild(createActionButton('link', 'link', () => {
            if (this.editor.getAttributes('link').href) {
                this.editor.chain().focus().extendMarkRange('link').unsetLink().run();
            }
            else {
                // const url = prompt('Enter the URL');
                const modal = new Modal(`
                    <h1>${this.translate('editor.link.title', 'problem')}</hjson>
                    <form>
                        <input id="url" type="url" required placeholder="${this.translate('editor.link.placeholder', 'problem')}">
                        <button class="default">${this.translate('send', 'common')}</button>
                    </form>
                `);

                const form = new Form(modal.get('form'));
                form.submit(() => {
                    const url = form.getInput('url').value;
                    if (!url) return;
                    this.editor.chain().focus().setLink({href: url}).run();
                    modal.close();
                });

            }
        }));
        bubbleMenu.appendChild(createActionButton('image', 'image', () => {
            const url = 'https://autojudge.io/assets/img/autojudge.webp';
            this.editor.chain().focus().setImage({src: url}).run();
        }));
        bubbleMenu.appendChild(createActionButton('align-left', 'align-left', () => this.editor.chain().focus().setTextAlign('left').run()));
        bubbleMenu.appendChild(createActionButton('align-center', 'align-center', () => this.editor.chain().focus().setTextAlign('center').run()));
        bubbleMenu.appendChild(createActionButton('align-right', 'align-right', () => this.editor.chain().focus().setTextAlign('right').run()));
        bubbleMenu.appendChild(createActionButton('align-justify', 'align-justify', () => this.editor.chain().focus().setTextAlign('justify').run()));

        return bubbleMenu;
    }

    destroy() {
        this.editor.destroy();
    }

    getContent() {
        return this.content;
    }
}