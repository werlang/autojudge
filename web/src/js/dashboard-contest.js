import Card from "./components/card.js";
import Contest from "./model/contest.js";
import Modal from "./components/modal.js";

export default {
    build: async function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML = `
            <h1>${this.translate('contest', 'common', {count: 2})}</h1>
            <div id="contest-container"></div>
        `;

        const container = document.querySelector('#contest-container');

        const contestsPromise = Contest.getAll();

        let { contests } = await contestsPromise;
        console.log(contests);

        contests = contests.map(contest => {
            new Card(container, {
                titlePosition: 'head',
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
                    text: `${this.translate('open', 'common')} / ${this.translate('edit', 'common')}`,
                    isDefault: false,
                    callback: () => location.href = `/contests/${contest.id}` 
                });
            });
        });
    },
}
