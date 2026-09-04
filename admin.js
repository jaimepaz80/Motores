// admin.js
import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set, get, push, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const loginForm = document.getElementById('loginForm');
const updateForm = document.getElementById('updateForm');
const statusSelect = document.getElementById('statusSelect');
const typeGroup = document.getElementById('typeGroup');
const dateTimeGroup = document.getElementById('dateTimeGroup');
const dateInput = document.getElementById('dateInput');
const timeInput = document.getElementById('timeInput');
const obsGroup = document.getElementById('obsGroup');
const obsInput = document.getElementById('obsInput');
const logoutBtn = document.getElementById('logoutBtn');

statusSelect.addEventListener('change', () => {
    if (statusSelect.value === 'Sin motor') {
        typeGroup.style.display = 'none';
        obsGroup.style.display = 'none';
        dateTimeGroup.style.display = 'none'; // No pide fecha si no hay motor
        dateInput.required = false;
        timeInput.required = false;
        obsInput.required = false;
    } else if (statusSelect.value === 'Apagado') {
        typeGroup.style.display = 'block';
        obsGroup.style.display = 'block';
        dateTimeGroup.style.display = 'flex';
        dateInput.required = true;
        timeInput.required = true;
        obsInput.required = true;
    } else { // Prendido
        typeGroup.style.display = 'block';
        obsGroup.style.display = 'none';
        dateTimeGroup.style.display = 'flex';
        dateInput.required = true;
        timeInput.required = true;
        obsInput.required = false;
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, password)
        .catch(() => alert('Error de autenticación.'));
});

onAuthStateChanged(auth, (user) => {
    document.getElementById('loginSection').style.display = user ? 'none' : 'block';
    document.getElementById('adminPanel').style.display = user ? 'block' : 'none';
});

updateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const motorIndex = document.getElementById('motorSelect').value;
    const newStatus = statusSelect.value;
    const newType = newStatus === 'Sin motor' ? 'Ninguno' : document.getElementById('typeSelect').value;
    const observacion = newStatus === 'Apagado' ? obsInput.value : '';

    let eventTimestamp = null;
    if (newStatus !== 'Sin motor') {
        eventTimestamp = new Date(`${dateInput.value}T${timeInput.value}`).getTime();
    }

    try {
        const motorRef = ref(db, `motors/${motorIndex}`);
        const snapshot = await get(motorRef);
        const currentData = snapshot.exists() ? snapshot.val() : null;

        // VALIDACIÓN OPCIÓN A: No permitir apagado con fecha menor al encendido
        if (newStatus === 'Apagado' && currentData && currentData.status === 'Prendido') {
            if (currentData.last_startTime && eventTimestamp < currentData.last_startTime) {
                alert("ERROR LÓGICO: La fecha/hora de Apagado no puede ser anterior a la fecha/hora de Encendido actual.");
                return; // Bloquea la escritura
            }
        }

        // Preparar datos para actualizar el estatus actual
        const updateData = { type: newType, status: newStatus, observacion: observacion };
        if (newStatus === 'Prendido') {
            updateData.last_startTime = eventTimestamp;
        } else if (newStatus === 'Apagado') {
            // Mantiene el último encendido por seguridad de registro
            updateData.last_startTime = currentData ? currentData.last_startTime : null; 
        }

        await set(motorRef, updateData);

        // Registrar en el historial si no es "Sin motor"
        if (newStatus !== 'Sin motor') {
            const historyRef = ref(db, 'historial_bombeo');
            await push(historyRef, {
                motorId: parseInt(motorIndex),
                type: newType,
                event: newStatus,
                timestamp: eventTimestamp,
                observacion: observacion
            });
        }
        
        alert('Estatus e Historial actualizados correctamente.');
        updateForm.reset();
        
    } catch (error) {
        alert('Error en base de datos: ' + error.message);
    }
});

logoutBtn.addEventListener('click', () => signOut(auth));
