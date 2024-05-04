import Card from './components/card';
import Modal from './components/modal';
import Form from './components/form';
import Uploader from './components/uploader';

import '../less/index.less';

document.querySelector('footer #year').innerHTML = new Date().getFullYear();

// add cards
const cardContainer = document.querySelector('#options');

new Card(cardContainer, {
    id: 'instructions',
    icon: 'fa-solid fa-circle-question',
    title: 'Instructions',
    description: 'Learn how to use this tool'
}).click(async () => {
    const modal = await new Modal(null, { id: 'instructions' }).loadContent('html/index-instructions.html');
    modal.addButton({
        text: 'OK, got it!',
        close: true,
    })
});


new Card(cardContainer, {
    id: 'problems',
    icon: 'fa-solid fa-file-code',
    title: 'Problems',
    description: 'Submit input and output for a new problem'
}).click(async () => {
    const modal = await new Modal(null, { id: 'problems' }).loadContent('html/index-problems.html');

    const form = new Form(modal.get('.form'));

    const uploader = new Uploader(form.get('#upload'), {
        accept: 'application/zip, application/octet-stream, application/x-zip-compressed, multipart/x-zip',
        placeholder: 'Test case file (.zip)',
        onSend: file => {
            // console.log(file);
        },
        onUpload: (file, data) => {
            // console.log(file, data);
            if (data.accepted === false) {
                uploader.setError({
                    message: 'Invalid file',
                    icon: 'fa-solid fa-exclamation-triangle',
                });
                form.setData({ 'upload': null });
                return;
            }

            form.setData({ 'upload': file });
            uploader.setContent({
                icon: 'fa-solid fa-check',
                message: data.name,
            });
        }
    });

    form.submit(async data => {
        // console.log(data)
        form.validate([
            { id: 'problem-id', rule: e => e.length >= 3, message: 'ID must be at least 3 characters' }, 
            { id: 'upload', rule: e => {
                console.log(e)
                return e;
            }, message: 'Please upload a valid file' },
        ]);
    });



});

new Card(cardContainer, {
    id: 'judge',
    icon: 'fa-solid fa-gavel',
    title: 'Judge',
    description: 'Submit code to be judged'
}).click(() => {
    console.log('judge');
});

