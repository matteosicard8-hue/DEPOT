// Corrected script.js with null checks before addEventListener calls
const button = document.getElementById('myButton');
if (button) {
    button.addEventListener('click', () => {
        console.log('Button clicked');
    });
} else {
    console.error('Button not found');
}