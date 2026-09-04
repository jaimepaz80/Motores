// admin.js
import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const loginForm = document.getElementById('loginForm');
const updateForm = document.getElementById('updateForm');
const statusSelect = document.getElementById('statusSelect');
const typeGroup = document.getElementById('typeGroup');
const obsGroup = document.getElementById('obsGroup');
const obsInput = document.getElementById('obsInput');
const logoutBtn = document.getElementById('logoutBtn');

// Controlar visualización de los campos según el estatus
statusSelect.addEventListener('change', () => {
    if (statusSelect.value === 'Sin motor') {
        typeGroup.style.display = 'none'; // No hay motor, no hay tipo
        obsGroup.style.display = 'none';
        obsInput.required = false;
        obsInput.value = '';
    } else if (statusSelect.value === 'Apagado') {
        typeGroup.style.display = 'block';
        obsGroup.style.display = 'block';
        obsInput.required = true;
    } else { // Prendido
        typeGroup.style.display = 'block';
        obsGroup.style.display = 'none';
        obsInput.required = false;
        obsInput.value = '';
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
    const newStatus = statusSelect.value;
    
    // Si no hay motor, forzamos el tipo a "Ninguno", de lo contrario tomamos el del selector
    const newType = newStatus === 'Sin motor' ? 'Ninguno' : document.getElementById('typeSelect').value;
    
    // Observación solo aplica si está apagado
    const observacion = newStatus === 'Apagado' ? obsInput.value : '';

    // Escribir en la ruta exacta del motor
    const motorRef = ref(db, `motors/${motorIndex}`);
    set(motorRef, {
        type: newType,
        status: newStatus,
        observacion: observacion
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
