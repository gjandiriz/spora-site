function entrarAPuesto() {
    estacionActual = document.getElementById('select-puesto-op').value;
    if (!estacionActual) return alert("Seleccioná un puesto");
    document.getElementById('estacion-op').innerText = estacionActual;
    mostrar('pantalla-operario');
}

function encenderCamara() {
    if (isProcessing) return;

    const readerDiv = document.getElementById("reader");
    readerDiv.style.display = "block";

    html5QrCode = new Html5Qrcode("reader");

    const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
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
        console.error("Error al iniciar cámara:", err);
        isProcessing = false;
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
    const infoPanel = document.getElementById('info-tecnica-escaneo'); // El nuevo panel

    input.value = "⌛ REGISTRANDO...";
    const textoOriginal = String(id || "").trim();
    let idFinal = textoOriginal;

    // Tu lógica de limpieza se mantiene igual
    const match = textoOriginal.match(/\b\d+\s*-\s*\d+\b/m);
    if (match) {
        idFinal = match[0].replace(/\s+/g, "");
    }

    callServer("registrar", {
        id: idFinal,
        estacion: estacionActual,
        usuario: usuarioActual
    }, res => {
        if (res.status === "OK") {
            input.value = "✅ " + idFinal;
            
            // MOSTRAR FICHA TÉCNICA
            // res.datos contiene TODA la fila de DB_PIEZAS
            let htmlFicha = `
                <div style="background: #1e3799; color: white; padding: 15px; border-radius: 8px; border-left: 5px solid #00a8ff;">
                    <div style="font-size: 11px; text-transform: uppercase; opacity: 0.8;">Ficha de Fabricación</div>
                    <div style="font-size: 18px; font-weight: bold; margin: 5px 0;">${res.datos.CLIENTE || 'Sin Cliente'}</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; font-size: 14px;">
                        <div>📏 Medidas: <b>${res.datos.ANCHO} x ${res.datos.ALTO}</b></div>
                        <div>🎨 Tela: <b>${res.datos.TELA || '-'}</b></div>
                    </div>
                    <div style="margin-top: 10px; font-size: 13px; color: #fbc531;">
                        <b>OBS:</b> ${res.datos.OBSERVACIONES || 'Sin notas'}
                    </div>
                </div>
            `;
            infoPanel.innerHTML = htmlFicha;

        } else {
            input.value = "❌ ERROR";
            infoPanel.innerHTML = `<div style="background:#c0392b; color:white; padding:10px; border-radius:8px;">⚠️ ${res.msj}</div>`;
        }

        log.innerHTML = `<div>${new Date().toLocaleTimeString()}: ${res.msj} | ${idFinal}</div>` + log.innerHTML;

        setTimeout(() => {
            input.value = "LISTO PARA ESCANEAR";
            isProcessing = false;
            // No borramos la ficha técnica para que el operario pueda seguir leyéndola
        }, 2000);
    });
}
