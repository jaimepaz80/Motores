// admin.js
import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const loginForm = document.getElementById('loginForm');
const updateForm = document.getElementById('updateForm');
const typeSelect = document.getElementById('typeSelect');
const elecStatusOption = document.getElementById('elecStatus');
const logoutBtn = document.getElementById('logoutBtn');

// Controlar visualización de estatus eléctrico
typeSelect.addEventListener('change', () => {
    if (typeSelect.value === 'Eléctrico') {
        elecStatusOption.style.display = 'block';
    } else {
        elecStatusOption.style.display = 'none';
        // Reiniciar estatus si estaba en falta eléctrica
        if (document.getElementById('statusSelect').value === 'Falta de fluido eléctrica') {
            document.getElementById('statusSelect').value = 'Apagado';
        }
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
    const newStatus = document.getElementById('statusSelect').value;

    // Escribir en la ruta exacta del motor (motors/0, motors/1, etc.)
    const motorRef = ref(db, `motors/${motorIndex}`);
    set(motorRef, {
        type: newType,
        status: newStatus
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
