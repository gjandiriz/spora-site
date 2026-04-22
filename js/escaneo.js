// js/escaneo.js
// Estas variables ya están declaradas en main.js, así que no hace falta poner 'let' de nuevo
// Pero las usamos aquí para la lógica del lector.

function encenderCamara() {
    if (isProcessing) return;
    const readerDiv = document.getElementById("reader");
    readerDiv.style.display = "block"; 
    
    html5QrCode = new Html5Qrcode("reader");

    const config = { 
        fps: 15, 
        qrbox: { width: 250, height: 250 },
        // EL PARCHE CLAVE: Buscamos ambos formatos para que no falle en planta
        formatsToSupport: [ 
            Html5QrcodeSupportedFormats.QR_CODE, 
            Html5QrcodeSupportedFormats.CODE_128 
        ] 
    };

    html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (txt) => {
            isProcessing = true;
            html5QrCode.stop().then(() => { 
                readerDiv.style.display = "none"; 
                procesarScan(txt); 
            });
        }
    ).catch(err => {
        console.error("Error al iniciar cámara: ", err);
        alert("No se pudo abrir la cámara. Revisá los permisos del navegador.");
    });
}

function registrarManual() {
    const id = document.getElementById('input-manual').value.trim();
    if (id) { 
        procesarScan(id); 
        document.getElementById('input-manual').value = ""; 
    }
}

function procesarScan(id) {
    const input = document.getElementById('input-scan');
    input.style.color = "white";
input.style.background = "#07111f";
input.style.border = "1px solid #2c3e50";
    const log = document.getElementById('log-scan');
    const info = document.getElementById('info-tecnica-escaneo');

    callServer("registrarEscaneo", {
        id: id,
        estacion: estacionActual,
        usuario: usuarioActual
    }, res => {

        if (!res || res.status !== "OK") {
            input.value = "❌ ERROR | " + id;
            if (log) {
                log.innerHTML = `<div>${new Date().toLocaleTimeString()}: ERROR</div>` + log.innerHTML;
            }
            return;
        }

        if (res.msj === "ESCANEO_OK") {
    input.value = "✅ OK | " + id;
    input.style.background = "#12351f";
    input.style.border = "1px solid #2ecc71";
} else if (res.msj === "ESCANEO_SALTO_FLUJO") {
    input.value = "⚠️ SALTO DE FLUJO | " + id;
    input.style.background = "#4a3410";
    input.style.border = "1px solid #f1c40f";
} else {
    input.value = "❌ " + res.msj + " | " + id;
    input.style.background = "#4a1f1f";
    input.style.border = "1px solid #e74c3c";
}

        if (info) {
            if (res.datosTecnicos) {
                let txt = `<div style="background:#222; padding:10px; border:1px solid #444; border-radius:8px; text-align:left;">`;
                for (let key in res.datosTecnicos) {
                    txt += `<div style="margin-bottom:4px;"><small>${key}:</small> <b>${res.datosTecnicos[key]}</b></div>`;
                }
                txt += `</div>`;
                info.innerHTML = txt;
            } else {
                info.innerHTML = `<div style="background:#332; padding:10px; border:1px solid #665; border-radius:8px;">No se encontraron datos técnicos para este ID.</div>`;
            }
        }

        if (log) {
            log.innerHTML = `<div>${new Date().toLocaleTimeString()}: ${res.msj} | ${id}</div>` + log.innerHTML;
        }
    });
}
