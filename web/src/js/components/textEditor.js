import Modal from './modal.js';
import Form from './form.js';
import Toast from './toast.js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Text from '@tiptap/extension-text';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import Document from '@tiptap/extension-document';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import ImageExt from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';

// TODO: equation
// TODO: fix pdf generation when using images
// TODO: fix image sizes.
// TODO: add shortcuts tooltips


export default class TextEditor {
    constructor({ mode, element, content, translate, uploadImageCallback, getImageCallback } = {}) {
        this.mode = mode || 'html';
        this.translate = translate;
        this.uploadImageCallback = uploadImageCallback;
        this.getImageCallback = getImageCallback;

        if (!element) {
            throw new Error('Element is required');
        }
        this.element = element;

        // wrap element in a div
        if (this.mode === 'html') {
            const wrapper = document.createElement('div');
            wrapper.classList.add('text-editor');
            element.parentNode.insertBefore(wrapper, element);
            wrapper.appendChild(element);
        }

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
            const CustomImage = ImageExt.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        width: {
                            default: '30%',
                            parseHTML: element => element.style.width || 'auto',
                            renderHTML: attributes => {
                                if (!attributes.width) {
                                    return {};
                                }
                                return {
                                    width: attributes.width,
                                }
                            },
                        },
                        height: {
                            default: 'auto',
                            parseHTML: element => element.style.height || 'auto',
                            renderHTML: attributes => {
                                if (!attributes.height) {
                                    return {};
                                }
                                return {
                                    height: attributes.height,
                                };
                            },
                        },
                        textAlign: {
                            default: 'center',
                            parseHTML: element => element.style.textAlign || 'left',
                            renderHTML: attributes => {
                                if (!attributes.textAlign) {
                                    return {};
                                }
                                return {
                                    textAlign: attributes.textAlign,
                                };
                            },
                        },
                    };
                },
                renderHTML({ node, HTMLAttributes }) {
                    const { textAlign, ...rest } = HTMLAttributes;
                    return [
                        'div',
                        { style: `text-align: ${textAlign};` },
                        ['img', rest],
                    ];
                },
            });

            extensions.push(
                StarterKit,
                Underline,
                Subscript,
                Superscript,
                TextAlign.configure({
                    types: ['heading', 'paragraph', 'image', 'table'],
                }),
                CustomImage.configure({
                    // inline: true,
                    allowBase64: true,
                }),
                Link.configure({
                    openOnClick: false,
                }),
                Table.configure({
                    resizable: true,
                    allowTableNodeSelection: true,
                }),
                TableRow,
                TableHeader,
                TableCell,
                BubbleMenu.configure({
                    pluginKey: 'bubbleMenu',
                    element: this.createBubbleMenu(),
                    shouldShow: obj => this.shouldShow(obj),
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

    createActionButton(id, icon, group, callback) {
        const button = document.createElement('button');
        button.id = id;
        if (group) {
            if (!Array.isArray(group)) group = [group];
            button.classList.add(...group);
        }
        
        if (!Array.isArray(icon)) icon = [icon];
        button.innerHTML = `<i class="fa-solid ${icon.map(i => `fa-${i}`).join(' ')}"></i>`;

        button.addEventListener('click', () => {
            callback();
        });
        return button;
    }

    createBubbleMenu() {
        if (this.element.querySelector('.bubble-menu')) return;
        
        const bubbleMenu = document.createElement('div');
        this.bubbleMenu = bubbleMenu;
        bubbleMenu.classList.add('bubble-menu');
        document.body.appendChild(bubbleMenu);
        
        this.createBubbleMenuText();
        this.createBubbleMenuImage();
        this.createBubbleMenuTable();

        return bubbleMenu;
    }

    createBubbleMenuText() {
        const bubbleMenu = this.bubbleMenu;

        // Heading
        bubbleMenu.appendChild(this.createActionButton('heading', 'heading', 'text', () => {
            bubbleMenu.classList.toggle('heading');
            bubbleMenu.classList.toggle('text');
        }));
        bubbleMenu.appendChild(this.createActionButton('heading-1', '1', 'heading', () => this.editor.chain().focus().setHeading({ level: 1 }).run()));
        bubbleMenu.appendChild(this.createActionButton('heading-2', '2', 'heading', () => this.editor.chain().focus().setHeading({ level: 2 }).run()));
        bubbleMenu.appendChild(this.createActionButton('heading-3', '3', 'heading', () => this.editor.chain().focus().setHeading({ level: 3 }).run()));
        bubbleMenu.appendChild(this.createActionButton('paragraph', 'paragraph', 'heading', () => this.editor.chain().focus().setParagraph().run()));
        
        // Bold
        bubbleMenu.appendChild(this.createActionButton('bold', 'bold', 'text', () => this.editor.chain().focus().toggleBold().run()));

        // Italic
        bubbleMenu.appendChild(this.createActionButton('italic', 'italic', 'text', () => this.editor.chain().focus().toggleItalic().run()));

        // Underline
        bubbleMenu.appendChild(this.createActionButton('underline', 'underline', 'text', () => this.editor.chain().focus().toggleUnderline().run()));

        // Inline code
        bubbleMenu.appendChild(this.createActionButton('code', 'code', 'text', () => this.editor.chain().focus().toggleCode().run()));

        // Align
        bubbleMenu.appendChild(this.createActionButton('align', 'align-left', 'text', () => {
            bubbleMenu.classList.toggle('align');
            bubbleMenu.classList.toggle('text');
        }));
        bubbleMenu.appendChild(this.createActionButton('align-left', 'align-left', 'align', () => this.editor.chain().focus().setTextAlign('left').run()));
        bubbleMenu.appendChild(this.createActionButton('align-center', 'align-center', 'align', () => this.editor.chain().focus().setTextAlign('center').run()));
        bubbleMenu.appendChild(this.createActionButton('align-right', 'align-right', 'align', () => this.editor.chain().focus().setTextAlign('right').run()));
        bubbleMenu.appendChild(this.createActionButton('align-justify', 'align-justify', 'align', () => this.editor.chain().focus().setTextAlign('justify').run()));
        
        // Create link
        bubbleMenu.appendChild(this.createActionButton('link', 'link', 'text', () => {
            if (this.editor.getAttributes('link').href) {
                this.editor.chain().focus().extendMarkRange('link').unsetLink().run();
            }
            else {
                bubbleMenu.classList.add('hide');
                const modal = new Modal(`
                    <h1>${this.translate('editor.link.title', 'components')}</h1>
                    <form>
                        <input id="url" type="url" required placeholder="${this.translate('editor.link.placeholder', 'components')}">
                        <button class="default">${this.translate('send', 'common')}</button>
                    </form>
                `).onClose(() => bubbleMenu.classList.remove('hide'));

                const form = new Form(modal.get('form'));
                form.submit(() => {
                    const url = form.getInput('url').value;
                    if (!url) return;
                    this.editor.chain().focus().setLink({href: url}).run();
                    modal.close();
                });

            }
        }));

        // Insert image
        bubbleMenu.appendChild(this.createActionButton('image', 'image', 'text', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = () => {
                const file = input.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = () => {
                    const img = new Image();
                    img.onload = async () => {
                        const maxWidth = 800;
                        const maxHeight = 600;

                        if (img.width * img.height > maxWidth * maxHeight) {
                            new Toast(`Image dimensions too large.`, { type: 'error' });
                            return;
                        }

                        const src = await this.uploadImageCallback(reader.result);
                        this.editor.chain().focus().setImage({ src: await this.getImageCallback(src) }).run();
                    };
                    img.src = reader.result;
                };
                reader.readAsDataURL(file);
            };
            input.click();
        }));

        // Insert Table
        bubbleMenu.appendChild(this.createActionButton('table', 'table', 'text', () => {
            this.editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run();
        }));

        // More
        bubbleMenu.appendChild(this.createActionButton('more', 'ellipsis-vertical', 'text', () => {
            bubbleMenu.classList.toggle('more');
            bubbleMenu.classList.toggle('text');
        }));

        // Strikethrough
        bubbleMenu.appendChild(this.createActionButton('strike', 'strikethrough', 'more', () => this.editor.chain().focus().toggleStrike().run()));

        // Code block
        bubbleMenu.appendChild(this.createActionButton('code-block', 'file-code', 'more', () => this.editor.chain().focus().toggleCodeBlock().run()));

        // Bullet list
        bubbleMenu.appendChild(this.createActionButton('bullet', 'list-ul', 'more', () => this.editor.chain().focus().toggleBulletList().run()));

        // Numbered list
        bubbleMenu.appendChild(this.createActionButton('number', 'list-ol', 'more', () => this.editor.chain().focus().toggleOrderedList().run()));
        
        // Subscript
        bubbleMenu.appendChild(this.createActionButton('sub', 'subscript', 'more', () => this.editor.chain().focus().toggleSubscript().run()));

        // Superscript
        bubbleMenu.appendChild(this.createActionButton('sup', 'superscript', 'more', () => this.editor.chain().focus().toggleSuperscript().run()));
        
        // Quote
        bubbleMenu.appendChild(this.createActionButton('quote', 'quote-right', 'more', () => this.editor.chain().focus().toggleBlockquote().run()));
    }

    createBubbleMenuImage() {
        const bubbleMenu = this.bubbleMenu;

        // Align image left
        bubbleMenu.appendChild(this.createActionButton('align-left', 'align-left', 'image', () => this.editor.commands.updateAttributes('image', { textAlign: 'left' })));

        // Align image center
        bubbleMenu.appendChild(this.createActionButton('align-center', 'align-center', 'image', () => this.editor.commands.updateAttributes('image', { textAlign: 'center' })));

        // Align image right
        bubbleMenu.appendChild(this.createActionButton('align-right', 'align-right', 'image', () => this.editor.commands.updateAttributes('image', { textAlign: 'right' })));
        
        // Reduce image size
        let size = 30;
        bubbleMenu.appendChild(this.createActionButton('size-small', 'minus', 'image', () => {
            const { state, dispatch } = this.editor.view;
            const { selection } = state;
            const node = state.doc.nodeAt(selection.from);
            if (node.type.name === 'image') {
                size -= size > 10 ? 10 : 0;
                this.editor.commands.updateAttributes('image', { width: `${size}%`, height: 'auto' });
            }
        }));

        // Size container
        const sizeContainer = document.createElement('div');
        sizeContainer.classList.add('size-container', 'image');
        sizeContainer.innerHTML = `<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>`;
        sizeContainer.querySelectorAll('div').forEach((e,i) => e.addEventListener('click', () => {
            const { state, dispatch } = this.editor.view;
            const { selection } = state;
            const node = state.doc.nodeAt(selection.from);
            if (node.type.name === 'image') {
                size = (i + 1) * 10;
                this.editor.commands.updateAttributes('image', { width: `${size}%`, height: 'auto' });
            }
        }));
        bubbleMenu.appendChild(sizeContainer);

        // Increase image size
        bubbleMenu.appendChild(this.createActionButton('size-large', 'plus', 'image', () => {
            const { state, dispatch } = this.editor.view;
            const { selection } = state;
            const node = state.doc.nodeAt(selection.from);
            if (node.type.name === 'image') {
                size += size < 100 ? 10 : 0;
                this.editor.commands.updateAttributes('image', { width: `${size}%`, height: 'auto' });
            }
        }));
    }

    createBubbleMenuTable() {
        const bubbleMenu = this.bubbleMenu;

        // Toggle header
        bubbleMenu.appendChild(this.createActionButton('header-row', 'table', 'table', () => this.editor.commands.toggleHeaderCell()));

        // Add row before
        bubbleMenu.appendChild(this.createActionButton('row-before', ['diagram-next', 'rotate-180'], 'table', () => this.editor.commands.addRowBefore()));

        // Add row after
        bubbleMenu.appendChild(this.createActionButton('row-after', 'diagram-next', 'table', () => this.editor.commands.addRowAfter()));

        // Add column before
        bubbleMenu.appendChild(this.createActionButton('col-before', ['diagram-next', 'rotate-90'], 'table', () => this.editor.commands.addColumnBefore()));

        // Add column after
        bubbleMenu.appendChild(this.createActionButton('col-after', ['diagram-next', 'rotate-270'], 'table', () => this.editor.commands.addColumnAfter()));

        // Delete row
        bubbleMenu.appendChild(this.createActionButton('delete-row', 'eraser', 'table', () => this.editor.commands.deleteRow()));

        // Delete column
        bubbleMenu.appendChild(this.createActionButton('delete-col', ['eraser', 'rotate-90'], 'table', () => this.editor.commands.deleteColumn()));

        // Merge/Split cells
        bubbleMenu.appendChild(this.createActionButton('merge-cells', 'object-group', 'table', () => this.editor.commands.mergeOrSplit()));

        // Delete table
        bubbleMenu.appendChild(this.createActionButton('delete-table', 'trash-alt', 'table', () => this.editor.commands.deleteTable()));

        // More (text menu)
        bubbleMenu.appendChild(this.createActionButton('more', 'ellipsis-vertical', 'table', () => {
            bubbleMenu.classList.toggle('table');
            bubbleMenu.classList.toggle('text');
        }));
    }

    shouldShow({ editor, view, state, from, to }) {
        // console.log(editor, view, state, from, to);
        const { doc, selection } = state;
        const { empty } = selection;

        // return true;

        if (!this.bubbleMenu) return false;

        this.bubbleMenu.classList.remove('heading', 'align', 'more', 'table', 'image', 'text');

        if (!empty && editor.isActive('image')) {
            this.bubbleMenu.classList.add('image');
            return true;
        }
        else if (!empty && editor.isActive('table')) {
            const cellsSelected = this.element.querySelectorAll('.selectedCell').length;
            if (empty) {
            }
            else if (cellsSelected >= 1) {
                this.bubbleMenu.classList.add('table');
            }
            else {
                this.bubbleMenu.classList.add('text');
            }
            return true;
        }
        else if (!empty) {
            this.bubbleMenu.classList.add('text');
            return true;
        }

        return false;
    }

    destroy() {
        this.editor.destroy();
    }

    getContent() {
        return this.content;
    }
}