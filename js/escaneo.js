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
    const log = document.getElementById('log-scan');
    input.value = "⌛ REGISTRANDO..."; 
    
    callServer("registrar", {id: id, estacion: estacionActual, usuario: usuarioActual}, res => {
        // LÓGICA DE ICONOS SEGÚN EL MENSAJE REAL
        if (res.status === "OK") {
            if (res.msj === "ESCANEO_OK") {
                input.value = "✅ REGISTRADO";
            } else if (res.msj === "ESCANEO_SALTO_FLUJO") {
                input.value = "⚠️ SALTO DE FLUJO";
                input.style.color = "#f1c40f"; // Color amarillo de advertencia
            }
        } else {
            input.value = "❌ ERROR";
            input.style.color = "#e74c3c";
        }

        log.innerHTML = `<div>${new Date().toLocaleTimeString()}: <b>${res.msj}</b> (${id})</div>` + log.innerHTML;

        setTimeout(() => { 
            input.value = "LISTO PARA ESCANEAR"; 
            input.style.color = ""; // Reseteamos el color
            isProcessing = false; 
        }, 2000);
    });
}
