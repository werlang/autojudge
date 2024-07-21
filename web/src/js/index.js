import TypeIt from 'typeit';
import Card from './components/card.js';
import Modal from './components/modal.js';
import Form from './components/form.js';
import Uploader from './components/uploader.js';
import Toast from './components/toast.js';
import Problem from './model/problem.js';
import Judge from './model/judge.js';
import GoogleLogin from './helpers/google-login.js';
import Button from './components/button.js';

import '../less/index.less';

document.querySelector('footer #year').innerHTML = new Date().getFullYear();

// set up typewriter effect
document.querySelectorAll('section .col.text .content h1, #section-3 h1, #section-1 #welcome').forEach(e => {
    new TypeIt(e, {
        speed: 75,
        waitUntilVisible: true,
        cursorChar: '_',
    }).go();
});

const splashVideo = document.querySelector('#section-1 video');
splashVideo.playbackRate = 0.4;

GoogleLogin.init();
GoogleLogin.onFail(async () => {
    const modal = new Modal(`
        <h1>Sign up</h1>
        <p>Use your Google account to sign up and access the platform.</p>
        <div id="button"></div>
    `, { id: 'signup' });
    GoogleLogin.renderButton(modal.get('#button'));
});

// bind buttons to google login
document.querySelectorAll(`#section-1 #join, #section-4 #problems, #section-5 #contests, #section-6 #teams`).forEach(e => {
    new Button({ element: e }).click(async () => {
        if (GoogleLogin.getCredential()) {
            location.href = '/dashboard';
            return;
        }
        return GoogleLogin.prompt();
    });
});

GoogleLogin.onSignIn(async () => {
    location.href = '/dashboard';
});


// add cards
const cardContainer = document.querySelector('#options');


new Card(cardContainer, {
    id: 'problems',
    icon: 'fa-solid fa-circle-question',
    title: 'Problems',
    description: 'The fuel for the competition! Create and submit problems here.',
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
    id: 'instructions',
    icon: 'fa-solid fa-medal',
    title: 'Contests',
    description: 'Where the magic happens! Manage contests and their teams.',
}).click(async () => {
    const modal = await new Modal(null, { id: 'instructions' }).loadContent('index-instructions');
    modal.addButton({
        text: 'OK, got it!',
        close: true,
    })
});


new Card(cardContainer, {
    id: 'judge',
    icon: 'fa-solid fa-people-group',
    title: 'Teams',
    description: 'Who will be the champion? Participate in the contest.',
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
