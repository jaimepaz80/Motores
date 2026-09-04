// admin.js
import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const loginForm = document.getElementById('loginForm');
const updateForm = document.getElementById('updateForm');
const statusSelect = document.getElementById('statusSelect');
const motivoGroup = document.getElementById('motivoGroup');
const motivoInput = document.getElementById('motivoInput');
const logoutBtn = document.getElementById('logoutBtn');

// Mostrar cuadro de texto solo si el estatus es "Apagado"
statusSelect.addEventListener('change', () => {
    if (statusSelect.value === 'Apagado') {
        motivoGroup.style.display = 'block';
        motivoInput.required = true;
    } else {
        motivoGroup.style.display = 'none';
        motivoInput.required = false;
        motivoInput.value = ''; // Limpiar el texto si se cambia a Prendido
    }
});

// 1. Manejo del Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Login exitoso, onAuthStateChanged manejará la UI
        })
        .catch((error) => {
            alert('Error de autenticación: Verifique sus credenciales.');
        });
});

// 2. Proteger la ruta y manejar UI
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
    } else {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
    }
});

// 3. Actualizar estatus en Firebase
updateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const motorIndex = document.getElementById('motorSelect').value;
    const newType = document.getElementById('typeSelect').value;
    const newStatus = statusSelect.value;
    const motivo = newStatus === 'Apagado' ? motivoInput.value : '';

    // Escribir en la ruta exacta del motor
    const motorRef = ref(db, `motors/${motorIndex}`);
    set(motorRef, {
        type: newType,
        status: newStatus,
        reason: motivo
    }).then(() => {
        alert('Estatus actualizado correctamente.');
    }).catch((error) => {
        alert('Error al actualizar: ' + error.message);
    });
});

// 4. Cerrar Sesión
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});
