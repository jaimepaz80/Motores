// viewer.js
import { db } from "./firebase-config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const moduleAGrid = document.getElementById('moduleA-grid');
const moduleBGrid = document.getElementById('moduleB-grid');

// Referencia a los motores en la base de datos
const motorsRef = ref(db, 'motors');

// Función para mapear el estatus a una clase CSS
function getStatusClass(status) {
    switch (status) {
        case 'Prendido': return 'status-on';
        case 'Apagado': return 'status-off';
        case 'En mantenimiento': return 'status-maint';
        case 'Preventivo': return 'status-maint';
        case 'Correctivo': return 'status-off'; // O podrías usar 'status-maint' si lo prefieres gris
        case 'Falta de fluido eléctrica': return 'status-elec';
        default: return '';
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
            const motorData = data[i];
            const motorCard = document.createElement('div');
            
            // Determinar módulo y nombre
            const module = i < 6 ? 'A' : 'B';
            const motorNumber = (i % 6) + 1;
            const motorName = `M${module}${motorNumber}`;

            motorCard.className = `motor-card ${getStatusClass(motorData.status)}`;
            motorCard.innerHTML = `
                <div class="motor-name">${motorName}</div>
                <div class="motor-type">${motorData.type}</div>
                <div class="motor-status">${motorData.status}</div>
            `;

            if (module === 'A') {
                moduleAGrid.appendChild(motorCard);
            } else {
                moduleBGrid.appendChild(motorCard);
            }
        }
    }
});
