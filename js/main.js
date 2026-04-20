// js/main.js
const API_URL = "https://script.google.com/macros/s/AKfycbxCvpLf99LNrikY7aQ2QzznuO-1NzcbccWovl5BW46NXdtUX8qMDYKeW2YiED9boEBX/exec";

let usuarioActual = "", estacionActual = "", html5QrCode = null, isProcessing = false;
let datosExcelRaw = [], listaColumnasExcel = [], estacionesParaFlujo = [];
let piezaDeMuestra = null, contratoVigente = null, datosTemporalesFilas = [];

function callServer(action, params, callback) {
    params.action = action;
    const formData = new FormData();
    for (const key in params) {
        formData.append(key, params[key]);
    }

    fetch(API_URL, { method: 'POST', body: formData })
        .then(r => r.text())
        .then(txt => {
            let data;
            try {
                data = JSON.parse(txt);
            } catch (parseError) {
                console.error("Respuesta no JSON:", txt);
                return;
            }
            callback(data);
        })
        .catch(e => console.error("Error API:", e));
}

function mostrar(id) {
    document.querySelectorAll('.card > div, .card > section').forEach(d => d.classList.add('hidden'));
    const el = document.getElementById(id); 
    if(el) el.classList.remove('hidden');
}

// Lógica de Login
function login() {
    const pin = document.getElementById('pin-login').value;
    callServer("login", {pin: pin}, res => {
        if (res.status === "OK") {
            usuarioActual = res.usuario.nombre;
            if (res.usuario.rol === "GERENTE") {
                mostrar('pantalla-menu');
            } else {
                document.getElementById('nombre-op').innerText = usuarioActual;
                document.getElementById('nombre-op-scan').innerText = usuarioActual;
                const sel = document.getElementById('select-puesto-op');
                sel.innerHTML = '<option value="">-- Puesto --</option>';
                res.puestosDisponibles.forEach(p => sel.innerHTML += `<option value="${p}">${p}</option>`);
                mostrar('pantalla-seleccion-puesto');
            }
        } else alert(res.mensaje);
    });
}

function verEventos() {
    mostrar('pantalla-eventos');
    cargarEventos();
}

function cargarEventos() {
    const cont = document.getElementById('tabla-eventos');
    cont.innerHTML = "⌛ Cargando...";

    callServer("obtenerEventosHistorial", {}, res => {
        if (res.status === "ERROR") {
            cont.innerHTML = "❌ " + res.msj;
            return;
        }

        if (!res.eventos || res.eventos.length === 0) {
            cont.innerHTML = "Sin eventos";
            return;
        }

        let html = `
            <table style="width:100%; border-collapse: collapse;">
                <tr style="background:#333;">
                    <th>Hora</th>
                    <th>Pieza</th>
                    <th>Operario</th>
                    <th>Estación</th>
                    <th>Resultado</th>
                </tr>
        `;

        res.eventos.forEach(ev => {
            html += `
                <tr style="border-bottom:1px solid #444;">
                    <td>${new Date(ev.fecha).toLocaleTimeString()}</td>
                    <td>${ev.pieza}</td>
                    <td>${ev.operario}</td>
                    <td>${ev.estacion}</td>
                    <td>${ev.mensaje}</td>
                </tr>
            `;
        });

        html += `</table>`;

        cont.innerHTML = html;
    });
}
function buscarTrazabilidad() {
    const term = document.getElementById('input-busqueda-trazabilidad').value.trim();
    if (!term) return alert("Por favor, ingresá un dato (Pieza, Cliente, etc.)");

    const detalle = document.getElementById('detalle-trazabilidad');
    
    // Limpiamos y avisamos que estamos buscando
    detalle.innerHTML = `<div style="text-align:center; padding:20px;">⌛ Rastreando <b>${term}</b> en el historial...</div>`;

    callServer("buscarTrazabilidad", { filtro: term }, res => {
        if (res.status === "ERROR" || !res.eventos || res.eventos.length === 0) {
            detalle.innerHTML = `
                <div style="background:rgba(231, 76, 60, 0.1); border:1px solid #e74c3c; color:#e74c3c; padding:15px; border-radius:8px; text-align:center;">
                    ❌ No se encontró actividad para: <b>${term}</b><br>
                    <small style="color:#aaa;">Probá con otro número de pieza o nombre.</small>
                </div>`;
            return;
        }

        // Si hay datos, dibujamos la Línea de Tiempo
        let html = `<div style="display:flex; flex-direction:column; gap:12px; padding:10px;">`;
        
        res.eventos.forEach((ev) => {
            const fecha = new Date(ev.fecha).toLocaleString('es-AR');
            html += `
                <div style="border-left: 2px solid #3498db; padding-left: 15px; position: relative;">
                    <div style="width: 10px; height: 10px; background: #3498db; border-radius: 50%; position: absolute; left: -6px; top: 5px;"></div>
                    <div style="font-size: 10px; color: #888;">${fecha}</div>
                    <div style="font-size: 13px; margin-top:2px;">
                        <b>${ev.estacion}</b> | Pieza: <b style="color:#3498db;">${ev.pieza}</b><br>
                        Operario: <span style="color:#2fc95c">${ev.operario}</span>
                    </div>
                    <div style="font-size: 11px; color: #aaa; margin-top:3px;">Resultado: ${ev.mensaje}</div>
                </div>
            `;
        });
        
        html += `</div>`;
        detalle.innerHTML = html;
    });
}
function switchVistaEventos(vista) {
    const vivo = document.getElementById('wrapper-actividad-vivo');
    const buscar = document.getElementById('wrapper-buscador-trazabilidad');
    const btnVivo = document.getElementById('btn-vista-vivo');
    const btnBuscar = document.getElementById('btn-vista-buscar');

    if (vista === 'vivo') {
        vivo.classList.remove('hidden');
        buscar.classList.add('hidden');
        btnVivo.style.background = '#2ecc71';
        btnBuscar.style.background = '#444';
        cargarEventos(); // Cargamos la tabla general
    } else {
        vivo.classList.add('hidden');
        buscar.classList.remove('hidden');
        btnVivo.style.background = '#444';
        btnBuscar.style.background = '#3498db';
    }
}
