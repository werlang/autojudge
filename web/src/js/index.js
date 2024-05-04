import Card from './components/card';
import Modal from './components/modal';
import Form from './components/form';
import Uploader from './components/uploader';
import Toast from './components/toast';
import LocalData from './helpers/localData';

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
    form.setData({ file: null });

    updateProblemsList();

    const uploader = new Uploader(form.get('#upload'), {
        accept: 'application/zip, application/octet-stream, application/x-zip-compressed, multipart/x-zip',
        placeholder: 'Test case file (.zip)',
        onSend: file => {
            // console.log(file);
        },
        onUpload: (file, data) => {
            // console.log(file, data);
            if (data.accepted === false) {
                form.setData({ file: null });
                return;
            }

            form.setData({ file });
        }
    });

    form.submit(async data => {
        // console.log(data)
        const validation = form.validate([
            { id: 'problemid', rule: e => e.length >= 3, message: 'ID must be at least 3 characters' }, 
            { id: 'file', rule: e => e, message: 'Please upload a valid file' },
        ]);

        if (validation.fail.total > 0) return;

        let problems = new LocalData({ id: 'problems' }).get() || {};
        problems[data.problemid] = data.file;

        new LocalData({
            id: 'problems',
            data: problems,
            expires: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 year
        }).set();

        updateProblemsList();

        form.clear();
        uploader.reset();
        new Toast('Problem uploaded', { customClass: 'success', timeOut: 5000 });
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

function updateProblemsList() {
    const problems = new LocalData({ id: 'problems' }).get() || {};
    if (Object.keys(problems).length == 0) return;

    const container = document.querySelector('#problems-list');    
    container.innerHTML = '<div class="title">Submitted problems:</div>';
    const list = document.createElement('ul');

    for (let id in problems) {
        const item = document.createElement('li');
        item.innerHTML = `<a href="${problems[id]}" download="${id}"><i class="fa-solid fa-download"></i>${id}</a>`;
        list.appendChild(item);
    }

    container.appendChild(list);
}