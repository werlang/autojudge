import Card from './components/card';
import Modal from './components/modal';
import Form from './components/form';

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
    const modal = await new Modal().loadContent('html/index-instructions.html');
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
    const modal = await new Modal().loadContent('html/index-problems.html');
    // modal.addButton({
    //     text: 'Upload',
    //     close: true,
    // });

    const form = new Form(modal.get());
    // form.validate([
    //     { id: 'email', rule: e => e.value.includes('@'), message: 'E-mail inválido' },
    //     { id: 'password', rule: e => e.value.length >= 8, message: 'Senha muito curta' },
    // ]);

});

new Card(cardContainer, {
    id: 'judge',
    icon: 'fa-solid fa-gavel',
    title: 'Judge',
    description: 'Submit code to be judged'
}).click(() => {
    console.log('judge');
});

