import Card from "./components/card.js";
import Contest from "./model/contest.js";
import Modal from "./components/modal.js";
import Form from "./components/form.js";

export default {
    build: async function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML = `
            <h1>${this.translate('contest', 'common', {count: 2})}</h1>
            <p>${this.translate('contests.description', 'dashboard')}</p>
            <div id="contest-container"></div>
        `;

        const container = document.querySelector('#contest-container');

        const contestsPromise = Contest.getAll();

        let { contests } = await contestsPromise;
        console.log(contests);

        contests.map(contest => {
            new Card(container, {
                title: contest.name,
                description: contest.description,
                customClass: 'contest',
            })
            .click(async () => {
                contest = await new Contest({ id: contest.id }).get();
                console.log(contest);
                contest = contest.contest;
                // open the modal with the contest details
                const modal = new Modal(`
                    <h1>${contest.name}</h1>
                    <p>${contest.description}</p>
                `)
                .addButton({ text: this.translate('close', 'common'), close: true })
                .addButton({ 
                    text: `${this.translate('details', 'common')} / ${this.translate('edit', 'common')}`,
                    isDefault: false,
                    callback: () => location.href = `/contests/${contest.id}` 
                });
            });
        });

        // create card for adding a new contest
        new Card(container, {
            icon: 'fa-solid fa-plus',
            description: this.translate('contests.add', 'dashboard'),
            customClass: ['contest', 'add'],
        })
        .click(async () => this.add());
    },

    add: function() {
        const content = document.createElement('div');
        content.innerHTML = `
            <h1>${this.translate('contests.add', 'dashboard')}</h1>
            <form>
                <input id="name" name="name" type="text" required placeholder="${this.translate('name', 'common')}">
                <textarea id="description" name="description" required placeholder="${this.translate('description', 'common')}"></textarea>
                <input id="duration" name="duration" type="number" required placeholder="${this.translate('duration', 'common')}" min="10" max="1440" step="10" value=180>
                <button class="default">${this.translate('send', 'common')}</button>
            </form>
        `;
        const modal = new Modal(content, { id: 'add-contest' });
        const form = new Form(content.querySelector('form'));

        form.submit(async data => {
            // console.log(data);
            try {
                // create problem and redirect to it
                const { contest } = await new Contest(data).create();
                location.href = `/contests/${contest.id}`;
            }
            catch (error) {
                console.error(error);
                new Toast(this.translate('contests.error', 'dashboard'), { type: 'error' });
            }
        })
    },
}
