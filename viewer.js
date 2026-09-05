// viewer.js
import { db } from "./firebase-config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const moduleAGrid = document.getElementById('moduleA-grid');
const moduleBGrid = document.getElementById('moduleB-grid');
const moduleCGrid = document.getElementById('moduleC-grid');
const moduleDGrid = document.getElementById('moduleD-grid');

const motorsRef = ref(db, 'motors');

// Lógica de Memoria Silenciosa y Alertas
let initialLoad = true;
let previousState = {};
let lastKnownData = null;

// Solicitar permiso de notificaciones de Android/Chrome al entrar
if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
}

function getMotorInfo(id) {
    if (id < 6) return { station: 'Módulo A', prefix: 'MA', num: (id % 6) + 1 };
    if (id < 12) return { station: 'Módulo B', prefix: 'MB', num: (id % 6) + 1 };
    if (id < 18) return { station: 'Rebombeo', prefix: 'REB', num: (id % 6) + 1 };
    return { station: 'Ramon', prefix: 'RAM', num: (id % 6) + 1 };
}

function getStatusClass(status) {
    if (status === 'Prendido') return 'status-on';
    if (status === 'Apagado') return 'status-off';
    if (status === 'Sin motor') return 'status-empty';
    return 'status-off'; 
}

function triggerAlert(index, motorData) {
    const motorInfo = getMotorInfo(index);
    const isPrendido = motorData.status === 'Prendido';
    const colorClass = isPrendido ? 'alert-green' : 'alert-red';
    const title = isPrendido ? 'MOTOR ENCENDIDO' : 'MOTOR APAGADO';
    
    const eventTime = motorData.last_eventTime ? new Date(motorData.last_eventTime).toLocaleString() : new Date().toLocaleString();
    const obsText = motorData.observacion ? `<br><b>Observaciones:</b> ${motorData.observacion}` : '';

    // Notificación Nativa Android
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`Majagual: ${title}`, {
            body: `${motorInfo.station} - ${motorInfo.prefix}${motorInfo.num}\nFecha/Hora: ${eventTime}`
        });
    }

    // Ventana Emergente Modal
    const modal = document.getElementById('alertModal');
    const box = document.getElementById('alertBox');
    const titleEl = document.getElementById('alertTitle');
    const detailsEl = document.getElementById('alertDetails');

    box.className = `modal-content ${colorClass}`;
    titleEl.textContent = title;
    detailsEl.innerHTML = `
        <p><b>Estación:</b> ${motorInfo.station}</p>
        <p><b>Bomba:</b> ${motorInfo.prefix}${motorInfo.num}</p>
        <p><b>Tipo:</b> ${motorData.type}</p>
        <p><b>Fecha y Hora:</b> ${eventTime}</p>
        ${!isPrendido ? `<p style="color: #e74c3c;">${obsText}</p>` : ''}
    `;
    
    modal.style.display = 'flex';
}

document.getElementById('alertCloseBtn').addEventListener('click', () => {
    document.getElementById('alertModal').style.display = 'none';
});

function renderGrid(data) {
    moduleAGrid.innerHTML = ''; 
    moduleBGrid.innerHTML = '';
    moduleCGrid.innerHTML = ''; 
    moduleDGrid.innerHTML = '';

    for (let i = 0; i < 24; i++) {
        const motorData = data[i] || { status: 'Apagado', type: 'Desconocido', observacion: '' };
        const motorCard = document.createElement('div');
        const motorInfo = getMotorInfo(i);
        
        let gridTarget = moduleAGrid;
        if (motorInfo.prefix === 'MB') gridTarget = moduleBGrid;
        if (motorInfo.prefix === 'REB') gridTarget = moduleCGrid;
        if (motorInfo.prefix === 'RAM') gridTarget = moduleDGrid;

        const motorName = `${motorInfo.prefix}${motorInfo.num}`;
        let displayStatus = motorData.status;
        let displayType = motorData.type;
        let hoursHtml = '';

        if (motorData.status === 'Sin motor') {
            displayType = '-';
        } else {
            if (motorData.status === 'Apagado' && motorData.observacion) {
                displayStatus = `Apagado<br><span style="font-size: 0.85em; font-weight: bold; color: #555;">(Obs: ${motorData.observacion})</span>`;
            }
            
            // Lógica del Cronómetro vs Estático
            const totalH = motorData.total_hours || 0;
            const lastH = motorData.last_cycle_hours || 0;
            
            if (motorData.status === 'Prendido' && motorData.last_startTime) {
                const liveMs = Math.max(0, Date.now() - motorData.last_startTime);
                const liveH = liveMs / (1000 * 60 * 60);
                hoursHtml = `<div class="motor-hours">Total: ${(totalH + liveH).toFixed(2)}h<br>Actual: ${liveH.toFixed(2)}h</div>`;
            } else {
                hoursHtml = `<div class="motor-hours">Total: ${totalH.toFixed(2)}h<br>Último: ${lastH.toFixed(2)}h</div>`;
            }
        }

        motorCard.className = `motor-card ${getStatusClass(motorData.status)}`;
        motorCard.innerHTML = `
            <div class="motor-name">${motorName}</div>
            <div class="motor-type">${displayType}</div>
            <div class="motor-status">${displayStatus}</div>
            ${hoursHtml}
        `;
        gridTarget.appendChild(motorCard);
    }
}

onValue(motorsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        lastKnownData = data; // Guardamos en memoria local
        if (initialLoad) {
            for (let i = 0; i < 24; i++) {
                previousState[i] = data[i] ? data[i].status : 'Apagado';
            }
            initialLoad = false;
        } else {
            for (let i = 0; i < 24; i++) {
                const currentMotor = data[i] || { status: 'Apagado' };
                const prevStatus = previousState[i];
                
                if (prevStatus !== currentMotor.status) {
                    if (currentMotor.status === 'Prendido' || currentMotor.status === 'Apagado') {
                        triggerAlert(i, currentMotor);
                    }
                    previousState[i] = currentMotor.status;
                }
            }
        }
        renderGrid(data);
    }
});

// Bucle de cronómetro: re-renderiza la pantalla cada 60 segundos leyendo la memoria
setInterval(() => {
    if (lastKnownData) renderGrid(lastKnownData);
}, 60000);
