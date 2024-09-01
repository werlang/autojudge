import Card from "./components/card.js";
import Contest from "./model/contest.js";
import Problem from "./model/problem.js";

export default {
    build: async function() {
        const frame = document.querySelector('#frame');
        frame.innerHTML = `
            <h1>${this.translate('home.h1', 'dashboard')}</h1>
            <p>${this.translate('home.description', 'dashboard')}</p>
            <div id="dashboard-container"></div>
        `;

        const container = document.querySelector('#dashboard-container');

        // create cards for problems and contest
        const cardProblems = new Card(container, {
            title: this.translate('problem_other', 'common'),
            icon: 'fas fa-tasks',
            description: this.translate('home.problems', 'dashboard', {count: 2}),

        }).click(() => location.href = '/problems');

        const cardContests = new Card(container, {
            title: this.translate('contest_other', 'common'),
            icon: 'fas fa-trophy',
            description: this.translate('home.contests', 'dashboard', {count: 2}),
        }).click(() => location.href = '/contests');

        let [contests, problems] = await Promise.all([
            Contest.getAll(),
            Problem.getAll(),
        ]);
        contests = contests.contests;
        problems = problems.problems//.filter(problem => problem.author);

        cardProblems.get('.description').innerHTML = this.translate('home.problems', 'dashboard', {count: problems.length});
        cardContests.get('.description').innerHTML = this.translate('home.contests', 'dashboard', {count: contests.length});
    },
}