export default class Header {
    constructor({ user, menu }) {
        this.user = user || {};
        this.menu = menu;
        
        this.domElement = document.createElement('header');
        this.domElement.innerHTML = `
            <div id="left">
                <div class="menu">
                    <div class="icon"><i class="fas fa-bars"></i></div>
                </div>
                <div class="logo">
                    <a href="/">
                        <img src="/img/autojudge.webp" alt="AutoJudge">
                    </a>
                </div>
            </div>
            <div id="right">
                <div class="container">
                    <div class="profile">
                        ${
                            this.user.picture ? 
                                `<img src="${this.user.picture}" alt="Profile">` :
                                `<div class="icon"><i class="fas fa-user"></i></div>`
                        }
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentElement('afterbegin', this.domElement);

        this.domElement.querySelector('.menu').addEventListener('click', () => {
            this.menu.open();
        });
    }
}