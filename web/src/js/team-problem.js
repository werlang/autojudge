import Contest from "./model/contest.js";
import Card from "./components/card.js";
import Submission from "./model/submission.js";
import Team from "./model/team.js";

export default {
    build: async function() {
        // console.log(this.team);

        const {contest} = await new Contest({ id: this.team.contest.id }).get(true);
        // console.log(contest);
        const {submissions} = await new Submission({ token: Team.getToken() }).getAll();
        // console.log(submissions);

        const frame = document.querySelector('#frame');
        frame.innerHTML = `
            <h1>${this.translate('problem_other', 'common')}</h1>
            <div id="problems-container">
            </div>
        `;

        const problemsDOM = frame.querySelector('#problems-container');

        contest.problems.forEach(problem => {
            const teamsSolved = contest.teams.filter(team => team.solvedProblems.includes(problem.id));
            const solved = submissions.find(s => s.problem.id === problem.id && s.status === 'ACCEPTED');
            // console.log(solved);

            const card = new Card(problemsDOM, {
                title: problem.title,
                description: `<div class="info-container">
                    <div class="teams" title="${this.translate('teams-solved', 'problem')}"><i class="fas fa-users"></i> ${teamsSolved.length}</div>
                    ${solved ? 
                        `<div class="solved" title="${this.translate('score-solved', 'problem')}"><i class="fas fa-star"></i> ${parseFloat(solved.score).toFixed(1)}</div>` : 
                        `<div class="score" title="${this.translate('score-unsolved', 'problem')}"><i class="far fa-star"></i> ${parseFloat(problem.score).toFixed(1)}</div>`
                    }
                </div>`,
                icon: 'fas fa-lightbulb',
                customClass: 'problem-card',
            }).setColor(problem.color).click(() => {
                location.href = `/teams/problems/${problem.hash}`;
            });

        });

        if (this.refresh) {
            setTimeout(() => this.build(), 5000);
        }
    },
}

// TODO: check to prevent multiple submissions of the same problem at the same time