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
    if (!term) return alert("Ingresá un dato para buscar.");

    const detalle = document.getElementById('detalle-trazabilidad');
    detalle.innerHTML = "⌛ Cruzando datos con DB_PIEZAS...";

    callServer("buscarTrazabilidad", { filtro: term }, res => {
        if (res.status === "ERROR" || !res.eventos || res.eventos.length === 0) {
            detalle.innerHTML = "❌ No se encontró nada.";
            return;
        }

        let html = `<div style="display:flex; flex-direction:column; gap:20px;">`;
        
        res.eventos.forEach((ev) => {
            const fecha = new Date(ev.fecha).toLocaleString('es-AR');
            
            // Creamos la tabla de detalles técnicos si existen
            let tablaDetalle = "";
            if (ev.detalles) {
                tablaDetalle = `<table style="width:100%; font-size:10px; margin-top:10px; border:1px solid #444; border-collapse:collapse; background:#111;">`;
                for (let key in ev.detalles) {
                    if (ev.detalles[key]) { // Solo mostramos columnas que tengan datos
                        tablaDetalle += `<tr><td style="border:1px solid #333; padding:4px; color:#aaa; width:40%;">${key}</td><td style="border:1px solid #333; padding:4px; color:#fff;">${ev.detalles[key]}</td></tr>`;
                    }
                }
                tablaDetalle += `</table>`;
            }

            html += `
                <div style="border-left: 3px solid #3498db; padding-left: 15px; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 0 8px 8px 0;">
                    <div style="font-size: 11px; color: #3498db; font-weight:bold;">${fecha} - ${ev.estacion}</div>
                    <div style="font-size: 14px; margin: 5px 0;">Pieza: <b>${ev.pieza}</b> | Operario: <span style="color:#2fc95c;">${ev.operario}</span></div>
                    <div style="font-size: 12px; color: #888; margin-bottom:10px;">Estado: ${ev.mensaje}</div>
                    
                    <div style="background: rgba(52, 152, 219, 0.05); padding: 10px; border-radius: 4px; border: 1px solid rgba(52, 152, 219, 0.2);">
                        <span style="font-size: 10px; color: #3498db; font-weight:bold;">📋 FICHA TÉCNICA DE IMPORTACIÓN</span>
                        ${tablaDetalle}
                    </div>
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
