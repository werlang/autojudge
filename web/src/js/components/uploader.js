import Dropzone from 'dropzone';

// uploader class that creates a dropzone
// methods:
//   - constructor(dropElement, { accept, onSend, onUpload })
//     - accept: file type accepted (mime type)
//     - dropElement: DOM element where the dropzone will be created
//     - onSend: function called when the file is sent
//     - onUpload: function called when the file finishes uploading
//   - fetchFile(file): fetch file received from dropzone


export default class Uploader {
    
    constructor(dropElement, { accept, onSend, onUpload, placeholder }) {
        this.dropElement = dropElement;
        this.placeholder = placeholder || 'Click or Drop file here';
        const self = this;
    
        this.dropElement.classList.add('dropzone');
    
        if (document.querySelector('.dz-hidden-input')) {
            document.querySelector('.dz-hidden-input').remove();
        }
    
        new Dropzone('.dropzone', { 
            url: '/upload',
            acceptedFiles: accept || '*/*',
            maxFiles: 1,
            init: function() {
                // content inside the dropzone
                self.reset();
    
                // Listen for the addedfile event triggered when a file is added
                this.on('addedfile', file => {
                    // console.log(file)
                    // clear the old file if there is one
                    if (this.files.length >= 1) {
                        this.removeFile(this.files[0]);
                    }
                    
                    self.fileReady = false;
                    self.file = file;
                    const data = file;
                    if (onSend) {
                        onSend(file);
                    }
                    self.fetchFile(file).then(file => {
                        self.fileReady = true;
                        self.file = file;
                        if (onUpload) {
                            if (data.accepted === false) {
                                self.setError({
                                    message: 'Invalid file',
                                    icon: 'fa-solid fa-exclamation-triangle',
                                });
                                return;
                            }

                            self.setContent({
                                icon: 'fa-solid fa-check',
                                message: data.name,
                            });
                            self.dropElement.classList.add('success');
                            onUpload(file, data);
                        }
                    });
                });
            },
        });
    
        return this;
    }

    async fetchFile(file) {
        if (this.fileReady) return this.file;

        const reader = new FileReader();
        let fileData = new Promise(resolve => reader.onload = () => resolve(reader.result));
        reader.readAsDataURL(file);
        fileData = await fileData;

        return fileData;
    }

    setContent({ message = 'Click or Drop file here', icon = 'fa-solid fa-upload' }) {
        this.dropElement.classList.remove('error');
        this.dropElement.querySelector('button').innerHTML = `
            <div><i class="${icon}"></i></div>
            <div>${message}</div>
        `;
    }

    setError({ message = 'Invalid file', icon = 'fa-solid fa-exclamation-triangle' }) {
        this.setContent({ message, icon });
        this.dropElement.classList.add('error');
        this.dropElement.classList.remove('success');
    }

    reset() {
        this.setContent({
            message: this.placeholder,
            icon: 'fa-solid fa-upload',
        });
        this.dropElement.classList.remove('error');
        this.dropElement.classList.remove('success');
    }
}