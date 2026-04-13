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
