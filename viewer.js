// viewer.js
import { db } from "./firebase-config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const moduleAGrid = document.getElementById('moduleA-grid');
const moduleBGrid = document.getElementById('moduleB-grid');

// Referencia a los motores en la base de datos
const motorsRef = ref(db, 'motors');

// Función para mapear el estatus a una clase CSS
function getStatusClass(status) {
    if (status === 'Prendido') {
        return 'status-on';
    } else {
        return 'status-off';
    }
}

// Escuchar cambios en tiempo real
onValue(motorsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Limpiar grids
        moduleAGrid.innerHTML = '';
        moduleBGrid.innerHTML = '';

        // Recorrer los 12 motores (0 al 11)
        for (let i = 0; i < 12; i++) {
            // Asignar valores por defecto si no existen datos iniciales
            const motorData = data[i] || { status: 'Apagado', type: 'Desconocido', reason: '' };
            const motorCard = document.createElement('div');
            
            // Determinar módulo y nombre
            const module = i < 6 ? 'A' : 'B';
            const motorNumber = (i % 6) + 1;
            const motorName = `M${module}${motorNumber}`;

            // Preparar el texto a mostrar en la tarjeta
            let displayStatus = motorData.status;
            if (motorData.status === 'Apagado' && motorData.reason) {
                // Agregar el motivo si está apagado y existe un motivo guardado
                displayStatus = `Apagado<br><span style="font-size: 0.85em; font-weight: normal;">(${motorData.reason})</span>`;
            }

            motorCard.className = `motor-card ${getStatusClass(motorData.status)}`;
            motorCard.innerHTML = `
                <div class="motor-name">${motorName}</div>
                <div class="motor-type">${motorData.type}</div>
                <div class="motor-status">${displayStatus}</div>
            `;

            if (module === 'A') {
                moduleAGrid.appendChild(motorCard);
            } else {
                moduleBGrid.appendChild(motorCard);
            }
        }
    }
});
