import Contest from "./model/contest.js";
import Card from "./components/card.js";

export default {
    build: async function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML = `
            <h1>${this.translate('problem_other', 'common')}</h1>
            <div id="problems-container">
            </div>
        `;

        const problemsDOM = frame.querySelector('#problems-container');

        const {contest} = await new Contest({ id: this.team.contest.id }).get(true);
        // console.log(contest);

        contest.problems.forEach(problem => {
            new Card(problemsDOM, {
                title: problem.title,
                icon: 'fas fa-lightbulb',
                customClass: 'problem-card',
            }).setColor(problem.color).click(() => {
                location.href = `/teams/problems/${problem.hash}`;
            });
        });
    },
}
// TODO: show on the cards
//   1. how many teams have solved the problem
//   2. team's score for the problem OR score if the team solves the problem