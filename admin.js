// admin.js
import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set, get, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// Variables Formulario Avanzado
const advancedForm = document.getElementById('advancedForm');
const advMotorSelect = document.getElementById('advMotorSelect');
const customNameInput = document.getElementById('customNameInput');
const totalHoursInput = document.getElementById('totalHoursInput');
const lastCycleHoursInput = document.getElementById('lastCycleHoursInput');

statusSelect.addEventListener('change', () => {
    if (statusSelect.value === 'Sin motor') {
        typeGroup.style.display = 'none'; 
        obsGroup.style.display = 'none'; 
        dateTimeGroup.style.display = 'none';
        dateInput.required = false; timeInput.required = false; obsInput.required = false;
    } else if (statusSelect.value === 'Apagado') {
        typeGroup.style.display = 'block'; 
        obsGroup.style.display = 'block'; 
        dateTimeGroup.style.display = 'flex';
        dateInput.required = true; timeInput.required = true; obsInput.required = true;
    } else { 
        typeGroup.style.display = 'block'; 
        obsGroup.style.display = 'none'; 
        dateTimeGroup.style.display = 'flex';
        dateInput.required = true; timeInput.required = true; obsInput.required = false;
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, password).catch(() => alert('Error de autenticación.'));
});

onAuthStateChanged(auth, (user) => {
    document.getElementById('loginSection').style.display = user ? 'none' : 'block';
    document.getElementById('adminPanel').style.display = user ? 'block' : 'none';
    document.getElementById('advancedPanel').style.display = user ? 'block' : 'none';
});

// OPERACIÓN DIARIA: Estatus
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
        const currentData = snapshot.exists() ? snapshot.val() : {};

        if (newStatus === 'Apagado' && currentData.status === 'Prendido') {
            if (currentData.last_startTime && eventTimestamp < currentData.last_startTime) {
                alert("ERROR LÓGICO: La fecha/hora de Apagado no puede ser anterior a la fecha/hora de Encendido actual.");
                return;
            }
        }

        const currentTotal = currentData.total_hours ? currentData.total_hours : 0;
        const currentLastCycle = currentData.last_cycle_hours ? currentData.last_cycle_hours : 0;

        // Mantener el nombre personalizado si existe
        const updateData = { type: newType, status: newStatus, observacion: observacion };
        if (currentData.customName) updateData.customName = currentData.customName;
        
        if (newStatus !== 'Sin motor') updateData.last_eventTime = eventTimestamp;

        if (newStatus === 'Prendido') {
            updateData.last_startTime = eventTimestamp;
            updateData.total_hours = currentTotal;
            updateData.last_cycle_hours = currentLastCycle;
        } else if (newStatus === 'Apagado') {
            updateData.last_startTime = currentData.last_startTime ? currentData.last_startTime : null; 
            
            let cycleHours = 0;
            if (currentData.last_startTime && eventTimestamp > currentData.last_startTime) {
                cycleHours = (eventTimestamp - currentData.last_startTime) / (1000 * 60 * 60);
            }
            updateData.last_cycle_hours = cycleHours;
            updateData.total_hours = currentTotal + cycleHours;
        } else if (newStatus === 'Sin motor') {
            updateData.total_hours = currentTotal;
            updateData.last_cycle_hours = currentLastCycle;
        }

        await set(motorRef, updateData);

        if (newStatus !== 'Sin motor') {
            const historyRef = ref(db, 'historial_bombeo');
            await push(historyRef, {
                motorId: parseInt(motorIndex), type: newType, event: newStatus,
                timestamp: eventTimestamp, observacion: observacion
            });
        }
        alert('Estatus actualizado correctamente.'); 
        updateForm.reset();
        
    } catch (error) { alert('Error: ' + error.message); }
});

// CONFIGURACIÓN AVANZADA: Cargar datos al seleccionar
advMotorSelect.addEventListener('change', async () => {
    const index = advMotorSelect.value;
    const snapshot = await get(ref(db, `motors/${index}`));
    if (snapshot.exists()) {
        const d = snapshot.val();
        customNameInput.value = d.customName || '';
        totalHoursInput.value = d.total_hours ? d.total_hours.toFixed(2) : 0;
        lastCycleHoursInput.value = d.last_cycle_hours ? d.last_cycle_hours.toFixed(2) : 0;
    } else {
        customNameInput.value = '';
        totalHoursInput.value = 0;
        lastCycleHoursInput.value = 0;
    }
});

// CONFIGURACIÓN AVANZADA: Guardar con candado matemático
advancedForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const index = advMotorSelect.value;
    
    try {
        const motorRef = ref(db, `motors/${index}`);
        const snapshot = await get(motorRef);
        const currentData = snapshot.exists() ? snapshot.val() : { status: 'Apagado', type: 'Desconocido' };

        const inputTotal = parseFloat(totalHoursInput.value) || 0;
        const inputLastCycle = parseFloat(lastCycleHoursInput.value) || 0;
        
        // Verificamos si el administrador intentó alterar los números
        const dbTotal = currentData.total_hours ? parseFloat(currentData.total_hours.toFixed(2)) : 0;
        const dbLastCycle = currentData.last_cycle_hours ? parseFloat(currentData.last_cycle_hours.toFixed(2)) : 0;
        
        const hoursChanged = (inputTotal !== dbTotal) || (inputLastCycle !== dbLastCycle);

        // BLOQUEO MATEMÁTICO: No permitir calibrar horas si el motor está encendido
        if (hoursChanged && currentData.status === 'Prendido') {
            alert("ERROR: No puede calibrar o reiniciar las horas de un motor mientras está PRENDIDO, porque el cronómetro en vivo está sumando tiempo. Por favor, APAGUE el motor desde el panel de operación y luego calibre las horas a cero.");
            return; // Detiene la transacción
        }

        // Si pasó el filtro, actualiza (permite cambiar nombre aunque esté prendido si no tocó las horas)
        const updateData = {
            ...currentData,
            customName: customNameInput.value.trim(),
            total_hours: inputTotal,
            last_cycle_hours: inputLastCycle
        };

        await set(motorRef, updateData);
        alert('Calibración y Configuración guardada correctamente.');
        advancedForm.reset();

    } catch (error) { alert('Error: ' + error.message); }
});

logoutBtn.addEventListener('click', () => signOut(auth));
