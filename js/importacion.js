console.log("js_importacion cargado OK");

function abrirPantallaProyecto() {
    callServer("obtenerContratoImportacion", {}, (res) => {
        const status = document.getElementById('status-contrato');
        const mapeador = document.getElementById('mapeador-columnas');
        const btnReset = document.getElementById('btn-reset-contrato');
        if (res && res.oc) {
            contratoVigente = res;
            status.innerHTML = "✅ FORMATO DETECTADO"; status.style.color = "#2ecc71";
            mapeador.classList.add('hidden'); btnReset.classList.remove('hidden');
        } else {
            contratoVigente = null;
            status.innerHTML = "ℹ️ SIN FORMATO: Mapeá ahora."; status.style.color = "#f1c40f";
            mapeador.classList.remove('hidden'); btnReset.classList.add('hidden');
        }
        mostrar('pantalla-proyecto');
    });
}

function procesarYSubir() {
    console.log("mapeador:", document.getElementById('mapeador-columnas'));
    const fileInput = document.getElementById('archivo-excel');
    const idProy = document.getElementById('id-proyecto-nuevo').value.trim();

    if (!idProy) {
        alert("Por favor, indicá el nombre del Proyecto.");
        return;
    }

    const mapeador = document.getElementById('mapeador-columnas');

if (
    !contratoVigente &&
    datosTemporalesFilas &&
    datosTemporalesFilas.length > 0 &&
    mapeador && !mapeador.classList.contains('hidden')
) {
        console.log("Confirmación de mapeo detectada, procediendo a importar...");
        ejecutarImportacionFinal(idProy, datosTemporalesFilas);
        return;
    }

    if (fileInput.files.length === 0) {
        alert("Seleccioná un archivo Excel.");
        return;
    }

    const archivo = fileInput.files[0];
    console.log("Archivo seleccionado:", archivo ? archivo.name : "sin archivo");

    const reader = new FileReader();

    reader.onerror = function() {
        alert("❌ Error al leer el archivo desde el navegador.");
    };

    reader.onload = function(e) {
        try {
            if (!e || !e.target || !e.target.result) {
                alert("❌ No se pudo obtener el contenido del archivo.");
                return;
            }

            if (typeof XLSX === "undefined") {
                alert("❌ La librería XLSX no está cargada.");
                return;
            }

            const data = new Uint8Array(e.target.result);
            console.log("Bytes leídos:", data.length);

            const workbook = XLSX.read(data, { type: 'array' });

            if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
                alert("❌ El archivo no contiene hojas válidas.");
                return;
            }

            const primeraHoja = workbook.SheetNames[0];
            console.log("Primera hoja detectada:", primeraHoja);

            const sheet = workbook.Sheets[primeraHoja];
            if (!sheet) {
                alert("❌ No se pudo acceder a la primera hoja del Excel.");
                return;
            }

            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            console.log("Filas detectadas:", json.length);

            if (!json || json.length === 0) {
                alert("❌ El archivo Excel está vacío.");
                return;
            }

            const headers = json[0] || [];
            listaColumnasExcel = headers;
            datosTemporalesFilas = json.slice(1);

            console.log("Encabezados detectados:", headers);
            console.log("Filas temporales:", datosTemporalesFilas.length);

            if (!headers.length) {
                alert("❌ No se encontraron encabezados en la primera fila del Excel.");
                return;
            }

            if (!contratoVigente) {
                console.log("No hay contrato vigente. Mostrando interfaz de mapeo...");
                generarInterfazMapeo(headers);
                return;
            }

            console.log("Contrato vigente detectado. Importando directamente...");
            ejecutarImportacionFinal(idProy, datosTemporalesFilas);

        } catch (error) {
            console.error("Error real al procesar Excel:", error);
            alert("❌ Error al procesar el archivo Excel:\n" + error.message);
        }
    };

    reader.readAsArrayBuffer(archivo);
}

function generarInterfazMapeo(headers) {
    const contenedor = document.getElementById('selector-mapeo');
    contenedor.innerHTML = `
        <p style="font-size:11px; color:#f1c40f; margin-bottom:10px;">
            ⚠️ CONFIGURACIÓN DE CÓDIGO: seleccioná las columnas que forman el identificador único.
        </p>
    `;

    document.getElementById('mapeador-columnas').classList.remove('hidden');

    const camposBase = [
        { id: "oc", etiqueta: "📄 Número de OC (Obligatorio para Código)" },
        { id: "nroPieza", etiqueta: "🔢 Nro de Pieza / Ítem (Obligatorio para Código)" }
    ];

    const camposExtra = [];
    for (let i = 1; i <= 10; i++) {
        camposExtra.push({ id: `extra_${i}`, etiqueta: `📊 Dato Adicional ${i}` });
    }

    const todosLosCampos = [...camposBase, ...camposExtra];

    todosLosCampos.forEach(campo => {
        let options = `<option value="">-- Seleccionar Columna --</option>`;
        options += headers.map((h, index) => `<option value="${index}">${h || 'Columna ' + (index + 1)}</option>`).join('');

        contenedor.innerHTML += `
            <div style="margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:5px;">
                <label style="font-size:11px; display:block; color:${campo.id === 'oc' || campo.id === 'nroPieza' ? '#2fc95c' : '#aaa'}; font-weight:bold;">
                    ${campo.etiqueta}:
                </label>
                <select id="sel-${campo.id}" style="width:100%; padding:4px; background:#222; color:white; border:1px solid #444;">
                    ${options}
                </select>
            </div>
        `;
    });
}

function ejecutarImportacionFinal(idProyecto, filas) {
    const getV = (id) => {
        const el = document.getElementById('sel-' + id);
        return el ? el.value : ""; 
    };

    if (!contratoVigente) {
        console.log("Capturando nuevo contrato...");
        const nuevoContrato = {
            oc: getV('oc'),
            nroPieza: getV('nroPieza'),
            cliente: getV('cliente'),
            extra_1: getV('extra_1'), 
            extra_2: getV('extra_2'),
            extra_3: getV('extra_3'), 
            extra_4: getV('extra_4'),
            extra_5: getV('extra_5'), 
            extra_6: getV('extra_6'),
            extra_7: getV('extra_7'), 
            extra_8: getV('extra_8'),
            extra_9: getV('extra_9'), 
            extra_10: getV('extra_10')
        };

        if (!nuevoContrato.oc || !nuevoContrato.nroPieza) {
            return alert("❌ Error: Debés seleccionar al menos OC y Nro de Pieza.");
        }

        callServer("guardarContratoImportacion", { contrato: JSON.stringify(nuevoContrato) }, (res) => {
            if (res.status === "OK") {
                enviarDatosAlServidor(idProyecto, filas);
            } else {
                alert("Error al guardar contrato: " + res.msj);
            }
        });
    } else {
        enviarDatosAlServidor(idProyecto, filas);
    }
}

function enviarDatosAlServidor(idProy, filas) {
    console.log("Limpiando filas vacías antes de enviar...");
    const filasLimpias = filas.filter(f => f.join('').trim() !== "");
    console.log("Enviando " + filasLimpias.length + " filas reales.");

    const botonImportar = document.querySelector('#pantalla-proyecto button[onclick="procesarYSubir()"]');
    const status = document.getElementById('status-contrato');

    if (botonImportar) {
        botonImportar.disabled = true;
        botonImportar.textContent = "IMPORTANDO...";
        botonImportar.style.opacity = "0.7";
        botonImportar.style.cursor = "not-allowed";
    }

    if (status) {
        status.innerHTML = "⌛ Importando datos, aguardá un momento...";
        status.style.color = "#f1c40f";
    }

    callServer("importarDatosMapeados", { 
        idProyecto: idProy, 
        filasJSON: JSON.stringify(filasLimpias),
        headersJSON: JSON.stringify(listaColumnasExcel || [])
    }, (res) => {
        if (botonImportar) {
            botonImportar.disabled = false;
            botonImportar.textContent = "SUBIR E IMPORTAR";
            botonImportar.style.opacity = "1";
            botonImportar.style.cursor = "pointer";
        }

        if (res.status === "OK") {
            alert("🚀 Importación exitosa: " + res.msj);
            document.getElementById('id-proyecto-nuevo').value = "";
            document.getElementById('archivo-excel').value = "";
            document.getElementById('selector-mapeo').innerHTML = "";
            document.getElementById('mapeador-columnas').classList.add('hidden');
            datosTemporalesFilas = [];
            listaColumnasExcel = [];

            if (status) {
                status.innerHTML = "✅ Importación finalizada correctamente.";
                status.style.color = "#2ecc71";
            }
            mostrar('pantalla-menu');
        } else {
            if (status) {
                status.innerHTML = "❌ Error durante la importación.";
                status.style.color = "#e74c3c";
            }
            alert("❌ Error: " + res.msj);
        }
    });
}
function resetearFormatoImportacion() {
    if (!confirm("⚠️ ¿Estás seguro? Esto borrará el mapeo de columnas guardado y tendrás que configurar el Excel de nuevo.")) return;

    // Llamamos al servidor para borrar el contrato/formato guardado
    callServer("guardarContratoImportacion", { contrato: "" }, (res) => {
        if (res.status === "OK") {
            alert("✅ Formato reseteado. Ahora podés configurar uno nuevo.");
            // Refrescamos la pantalla para que desaparezca el cartel verde y aparezca el mapeador
            abrirPantallaProyecto();
        } else {
            alert("❌ Error al resetear: " + res.mensaje);
        }
    });
}
