import Card from './components/card';
import Modal from './components/modal';
import Form from './components/form';
import Uploader from './components/uploader';
import Toast from './components/toast';
import Problem from './model/problem';
import Judge from './model/judge';

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
    const modal = await new Modal(null, { id: 'instructions' }).loadContent('index-instructions');
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
    const modal = await new Modal(null, { id: 'problems' }).loadContent('index-problems');
    
    const form = new Form(modal.get('.form'));
    form.setData({ file: null });

    updateProblemsList();

    const uploader = new Uploader(form.get('#upload'), {
        accept: 'application/zip, application/octet-stream, application/x-zip-compressed, multipart/x-zip',
        placeholder: 'Test case file (.zip)',
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

        new Problem({
            id: data.problemid,
            file: data.file,
        }).set();

        updateProblemsList();

        form.clear();
        uploader.reset();
        new Toast('Problem uploaded', { customClass: 'success', timeOut: 5000 });
    });

    function updateProblemsList() {
        const problems = Problem.get();
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
});

new Card(cardContainer, {
    id: 'judge',
    icon: 'fa-solid fa-gavel',
    title: 'Judge',
    description: 'Submit code to be judged'
}).click(async () => {
    const modal = await new Modal(null, { id: 'judge' }).loadContent('index-judge');
    const form = new Form(modal.get('.form'));
    form.setData({ file: null });

    const problems = Problem.get();
    const select = form.getSelect('problem');
    Object.keys(problems).forEach(p => select.addOption(p, p));

    const uploader = new Uploader(form.get('#upload'), {
        placeholder: 'Source Code File',
        onUpload: (file, data) => {
            // console.log(file, data);
            if (data.accepted === false) {
                form.setData({ file: null });
                return;
            }

            form.setData({ file });
            form.setData({ filename: data.name });
        }
    });

    form.submit(async data => {
        // console.log(data)
        const validation = form.validate([
            { id: 'problem', rule: e => e != 'none', message: 'Please select a problem' },
            { id: 'file', rule: e => e, message: 'Please upload a the source code file' },
        ]);

        if (validation.fail.total > 0) return;

        const problem = new Problem({ id: data.problem }).get();
        
        const resultDiv = modal.get('#result');
        resultDiv.innerHTML = `<pre><code>Running code<span id="dots">...</span></code></pre>`;
        const dotsSpan = modal.get('#result #dots');
        let dots = 0;
        const dotsInterval = setInterval(() => {
            dotsSpan.innerHTML = '.'.repeat(dots);
            dots = (dots + 1) % 4;
        }, 500);
        resultDiv.classList.add('loading');

        const run = await new Judge({
            tests: problem.file,
            code: data.file,
            filename: data.filename,
        }).run();
        // console.log(run);

        resultDiv.classList.remove('loading');
        clearInterval(dotsInterval);
        modal.get('#result').innerHTML = `<pre><code>${run.message}</code></pre>`;
    });

});
