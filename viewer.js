// viewer.js
import { db } from "./firebase-config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Declaración de los 4 contenedores
const moduleAGrid = document.getElementById('moduleA-grid');
const moduleBGrid = document.getElementById('moduleB-grid');
const moduleCGrid = document.getElementById('moduleC-grid');
const moduleDGrid = document.getElementById('moduleD-grid');

const motorsRef = ref(db, 'motors');

function getStatusClass(status) {
    if (status === 'Prendido') return 'status-on';
    if (status === 'Apagado') return 'status-off';
    if (status === 'Sin motor') return 'status-empty';
    return 'status-off'; 
}

onValue(motorsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Limpiar los 4 grids
        moduleAGrid.innerHTML = '';
        moduleBGrid.innerHTML = '';
        moduleCGrid.innerHTML = '';
        moduleDGrid.innerHTML = '';

        // Recorrer los 24 motores (0 al 23)
        for (let i = 0; i < 24; i++) {
            const motorData = data[i] || { status: 'Apagado', type: 'Desconocido', observacion: '' };
            const motorCard = document.createElement('div');
            
            let gridTarget = null;
            let prefix = '';

            // Lógica de enrutamiento por estaciones
            if (i < 6) {
                prefix = 'MA';
                gridTarget = moduleAGrid;
            } else if (i < 12) {
                prefix = 'MB';
                gridTarget = moduleBGrid;
            } else if (i < 18) {
                prefix = 'REB';
                gridTarget = moduleCGrid; // Rebombeo
            } else {
                prefix = 'SA';
                gridTarget = moduleDGrid; // San Antonio
            }

            const motorNumber = (i % 6) + 1;
            const motorName = `${prefix}${motorNumber}`;

            let displayStatus = motorData.status;
            let displayType = motorData.type;

            if (motorData.status === 'Sin motor') {
                displayType = '-';
            } else if (motorData.status === 'Apagado' && motorData.observacion) {
                displayStatus = `Apagado<br><span style="font-size: 0.85em; font-weight: bold; color: #555;">(Obs: ${motorData.observacion})</span>`;
            }

            motorCard.className = `motor-card ${getStatusClass(motorData.status)}`;
            motorCard.innerHTML = `
                <div class="motor-name">${motorName}</div>
                <div class="motor-type">${displayType}</div>
                <div class="motor-status">${displayStatus}</div>
            `;

            // Imprimir en la estación correspondiente
            gridTarget.appendChild(motorCard);
        }
    }
});
