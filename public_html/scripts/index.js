function init() {
    document.getElementById('playButton').addEventListener('click', () => {
        window.location.href = 'main.html';
    });
}

document.addEventListener('DOMContentLoaded', init);