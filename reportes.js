// reportes.js
import { db } from "./firebase-config.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const reportForm = document.getElementById('reportForm');
const btnPdf = document.getElementById('btnPdf');
const tableContainer = document.getElementById('tableContainer');
const reportTableBody = document.getElementById('reportTableBody');
const totalHoursCell = document.getElementById('totalHoursCell');

// Nomenclaturas exactas
function getMotorInfo(id) {
    if (id < 6) return { station: 'Módulo A', prefix: 'MA', num: (id % 6) + 1 };
    if (id < 12) return { station: 'Módulo B', prefix: 'MB', num: (id % 6) + 1 };
    if (id < 18) return { station: 'Rebombeo', prefix: 'REB', num: (id % 6) + 1 };
    return { station: 'Ramon', prefix: 'RAM', num: (id % 6) + 1 };
}

let currentReportData = [];

reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const startFilter = new Date(document.getElementById('filterStart').value).getTime();
    const endFilter = new Date(document.getElementById('filterEnd').value).getTime();
    const filterType = document.getElementById('filterType').value;
    
    // Leer checkboxes seleccionados
    const checkboxes = document.querySelectorAll('.station-cb:checked');
    const selectedStations = Array.from(checkboxes).map(cb => cb.value);

    if (selectedStations.length === 0) {
        alert("Debe seleccionar al menos una estación de bombeo.");
        return;
    }

    if (endFilter <= startFilter) {
        alert("La fecha de fin debe ser mayor a la fecha de inicio.");
        return;
    }

    try {
        const historyRef = ref(db, 'historial_bombeo');
        const snapshot = await get(historyRef);
        
        if (!snapshot.exists()) {
            alert("No hay registros en el historial.");
            return;
        }

        const allEvents = [];
        snapshot.forEach(child => {
            allEvents.push(child.val());
        });

        // Agrupar eventos por motor y ordenarlos cronológicamente
        const eventsByMotor = {};
        for(let i=0; i<24; i++) eventsByMotor[i] = [];
        
        allEvents.forEach(ev => {
            if(eventsByMotor[ev.motorId]) {
                eventsByMotor[ev.motorId].push(ev);
            }
        });

        for(let key in eventsByMotor) {
            eventsByMotor[key].sort((a, b) => a.timestamp - b.timestamp);
        }

        currentReportData = [];
        let grandTotalHours = 0;

        // Calcular horas con lógica de solapamiento
        for (let i = 0; i < 24; i++) {
            const motorInfo = getMotorInfo(i);
            
            // Filtro de estación múltiple
            if (!selectedStations.includes(motorInfo.prefix)) continue;

            const events = eventsByMotor[i];
            if (events.length === 0) continue;

            // Filtro de tipo (tomamos el tipo del último evento conocido en el rango)
            let latestType = events[events.length - 1].type;
            if (filterType !== 'Ambos' && latestType !== filterType) continue;

            let totalMilliseconds = 0;
            let isOn = false;
            let startTime = null;

            events.forEach(ev => {
                if (ev.event === 'Prendido') {
                    isOn = true;
                    startTime = ev.timestamp;
                } else if (ev.event === 'Apagado' && isOn) {
                    const endTime = ev.timestamp;
                    
                    // Calcular cruce de intervalos
                    const overlapStart = Math.max(startTime, startFilter);
                    const overlapEnd = Math.min(endTime, endFilter);
                    
                    if (overlapEnd > overlapStart) {
                        totalMilliseconds += (overlapEnd - overlapStart);
                    }
                    isOn = false;
                }
            });

            // Si quedó encendido (intervalo abierto), usar Fecha Fin como cierre virtual
            if (isOn) {
                const overlapStart = Math.max(startTime, startFilter);
                const overlapEnd = Math.min(Date.now(), endFilter); // Protege contra futuros irreales
                if (overlapEnd > overlapStart) {
                    totalMilliseconds += (overlapEnd - overlapStart);
                }
            }

            const hours = totalMilliseconds / (1000 * 60 * 60);
            
            if (hours > 0) {
                grandTotalHours += hours;
                currentReportData.push({
                    station: motorInfo.station,
                    name: `${motorInfo.prefix}${motorInfo.num}`,
                    type: latestType,
                    hours: hours.toFixed(2)
                });
            }
        }

        // Renderizar Tabla
        reportTableBody.innerHTML = '';
        currentReportData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.station}</td>
                <td>${row.name}</td>
                <td>${row.type}</td>
                <td>${row.hours} h</td>
            `;
            reportTableBody.appendChild(tr);
        });

        totalHoursCell.textContent = `${grandTotalHours.toFixed(2)} h`;
        
        tableContainer.style.display = 'block';
        btnPdf.style.display = 'block';

    } catch (error) {
        alert("Error al generar reporte: " + error.message);
    }
});

// Lógica de jsPDF nativo
btnPdf.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const startDate = new Date(document.getElementById('filterStart').value).toLocaleString();
    const endDate = new Date(document.getElementById('filterEnd').value).toLocaleString();

    doc.setFontSize(16);
    doc.text("Camaronera Majagual - Reporte de Bombeo", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Desde: ${startDate}`, 14, 30);
    doc.text(`Hasta: ${endDate}`, 14, 35);
    
    const tableData = currentReportData.map(row => [row.station, row.name, row.type, row.hours]);
    
    doc.autoTable({
        startY: 45,
        head: [['Estación', 'Motor', 'Tipo', 'Horas']],
        body: tableData,
        foot: [['', '', 'Total General:', totalHoursCell.textContent]],
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80] }
    });

    doc.save("Reporte_Bombeo.pdf");
});
