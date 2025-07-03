const modal = document.getElementById('confirmModal');
const message = document.getElementById('confirmMessage');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');
let currentForm = null;

document.querySelectorAll('form[data-confirm]').forEach(form => {
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        currentForm = this;
        message.textContent = this.dataset.confirm;
        modal.classList.remove('hidden');
    });
});

confirmYes.addEventListener('click', () => {
    if (currentForm) currentForm.submit();
});

confirmNo.addEventListener('click', () => {
    modal.classList.add('hidden');
    currentForm = null;
});