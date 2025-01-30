const clock = {
    createClock: function(parent) {
        this.parent = parent;
        const timeLeftDOM = parent;
        if (!timeLeftDOM || timeLeftDOM.innerHTML) return;

        const contest = this.contest;
        this.frozen = false;

        this.message = this.translate('contest-clock.finished', 'components');

        if (contest.startTime && contest.duration) {
            const startTime = new Date(contest.startTime).getTime();
            const duration = contest.duration * 60 * 1000;
            const timeLeft = new Date(duration - (Date.now() - startTime)).getTime();
            this.updateClock(timeLeft);
    
            // contest is finished
            if (timeLeft < 0) {
                timeLeftDOM.innerHTML = `
                    <span id="message">${this.message}</span>
                    <div id="clock">${this.formatClock(0)}</div>
                `;
            }
            else {
                let timeLeft = new Date(duration - (Date.now() - startTime)).getTime();
                this.message = this.translate('contest-clock.ends', 'components');
                
                // contest is not started yet
                if (startTime > Date.now()) {
                    timeLeft = new Date(startTime - Date.now()).getTime();
                    this.message = this.translate('contest-clock.starts', 'components');
                }
    
                timeLeftDOM.innerHTML = `
                    <span id="message">${this.message}</span>
                    <div id="clock">${this.formatClock(timeLeft)}</div>
                `;
    
                this.renderClock();
            }
        }
    },

    renderClock: function() {
        // check if clock is in the DOM
        const clock = this.parent.querySelector('#clock');
        if (!clock) return;
        
        clock.innerHTML = this.formatClock(this.timeLeft);

        if (this.contest.frozenScoreboard && !this.frozen) {
            clock.classList.add('frozen');
            this.frozen = true;
        }
        else if (!this.contest.frozenScoreboard && this.frozen) {
            clock.classList.remove('frozen');
            this.frozen = false;
        }
        
        if (this.timeLeft <= 0) {
            this.build();
        }
        else {
            setTimeout(() => this.renderClock(), 1000);
        }
    },

    updateClock: function(timeLeft) {
        if (this.clockTicking) return;
        this.clockTicking = true;
        this.timeLeft = timeLeft;
        // console.log(timeLeft);
        
        const start = Date.now();
        if (timeLeft > 0) {
            setTimeout(() => {
                this.clockTicking = false;
                this.updateClock(timeLeft - (Date.now() - start));
            }, 1000);
        }
    },

    formatClock: function(time) {
        const date = new Date(time);
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const seconds = date.getUTCSeconds();
        return `
            <span>${hours.toString().padStart(2, '0')}</span>:
            <span>${minutes.toString().padStart(2, '0')}</span>:
            <span>${seconds.toString().padStart(2, '0')}</span>
        `;
    },
}

export default (parent, { contest, translate }) => {
    clock.contest = contest;
    clock.translate = translate;
    clock.createClock(parent);
}