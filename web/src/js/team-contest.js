export default {
    build: async function(objects={}) {
        for (const key in objects) {
            this[key] = objects[key];
        }

        const frame = document.querySelector('#frame');
        frame.innerHTML = `
            <h1>${this.translate('team', 'team')}</h1>
            <p>${this.translate('team-info', 'team')}</p>
        `;
    },

}