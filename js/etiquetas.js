console.log("js_etiquetas cargado OK");

function cargarConfigurador() {
    const idProy = document.getElementById('id-proy-print').value;
    if (!idProy) return alert("Ingresa ID de Proyecto");

    const cont = document.getElementById('config-campos-etiqueta');
    cont.innerHTML = "⌛ Cargando...";

    callServer("listaGestion", { tipo: "PIEZAS_PROYECTO", id: idProy }, res => {
        if (res.status === "ERROR") return alert(res.msj);
        if (!res.piezas || res.piezas.length === 0) {
            cont.innerHTML = "❌ No se encontraron piezas para ese proyecto.";
            return;
        }

        window.headersActuales = res.encabezados;
        piezaDeMuestra = res.piezas[0];

        callServer("obtenerConfiguracionMaestra", {}, configJSON => {
            let estadoPlantilla = "";
            let configGuardada = null;
            let tipoCodigoGuardado = "BARRAS";
            let camposQRGuardados = [];

            if (configJSON) {
                try {
                    const plantilla = JSON.parse(configJSON);

                    if (Array.isArray(plantilla)) {
                        configGuardada = plantilla;
                        tipoCodigoGuardado = "BARRAS";
                        camposQRGuardados = [];
                    } else {
                        configGuardada = plantilla.campos || [];
                        tipoCodigoGuardado = plantilla.tipoCodigo || "BARRAS";
                        camposQRGuardados = plantilla.camposQR || [];
                    }

                    estadoPlantilla = `
                        <div style="margin-bottom:10px; padding:8px; border-radius:8px; background:rgba(46, 204, 113, 0.12); color:#2ecc71; font-size:11px;">
                            ✅ Plantilla detectada. Podés seguir usándola o modificarla y volver a guardar.
                        </div>
                    `;
                } catch (e) {
                    estadoPlantilla = `
                        <div style="margin-bottom:10px; padding:8px; border-radius:8px; background:rgba(241, 196, 15, 0.12); color:#f1c40f; font-size:11px;">
                            ⚠️ Se encontró una plantilla guardada pero no se pudo leer correctamente.
                        </div>
                    `;
                }
            } else {
                estadoPlantilla = `
                    <div style="margin-bottom:10px; padding:8px; border-radius:8px; background:rgba(241, 196, 15, 0.12); color:#f1c40f; font-size:11px;">
                        ℹ️ No hay plantilla guardada. Configurá una nueva y guardala.
                    </div>
                `;
            }

            cont.innerHTML = `
                ${estadoPlantilla}

                <div style="margin-bottom:10px; padding:8px; border-radius:8px; background:rgba(255,255,255,0.04);">
                    <label style="font-size:11px; display:block; color:#2fc95c; font-weight:bold; margin-bottom:5px;">
                        🏷️ Tipo de código
                    </label>
                    <select id="sel-tipo-codigo" onchange="actualizarPreviewLive()" style="width:100%; padding:6px; background:#222; color:white; border:1px solid #444;">
                        <option value="BARRAS" ${tipoCodigoGuardado === "BARRAS" ? "selected" : ""}>Código de Barras</option>
                        <option value="QR" ${tipoCodigoGuardado === "QR" ? "selected" : ""}>QR</option>
                    </select>
                    <small style="display:block; color:#aaa; margin-top:6px; font-size:10px;">
                        Si elegís QR, podés decidir qué campos van dentro del código y si llevan título o no.
                    </small>
                </div>

                <div style="margin-bottom:10px; padding:8px; border-radius:8px; background:rgba(255,255,255,0.04);">
                    <label style="font-size:11px; display:block; color:#2fc95c; font-weight:bold; margin-bottom:8px;">
                        👁️ Campos visibles en la etiqueta
                    </label>
                    <div id="filas-configuracion"></div>
                    <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
                        <button onclick="agregarFilaConfig()" style="background:#34495e; width:auto;">+ Campo</button>
                    </div>
                </div>

                <div style="margin-bottom:10px; padding:8px; border-radius:8px; background:rgba(255,255,255,0.04);">
                    <label style="font-size:11px; display:block; color:#2fc95c; font-weight:bold; margin-bottom:8px;">
                        📱 Campos para armar el QR
                    </label>
                    <div id="filas-configuracion-qr"></div>
                    <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
                        <button onclick="agregarFilaQR()" style="background:#34495e; width:auto;">+ Campo QR</button>
                    </div>
                </div>

                <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
                    <button onclick="resetearPlantillaEtiquetas()" style="background:#c0392b; width:auto;">🔄 Resetear Plantilla</button>
                </div>
            `;

            const filasCont = document.getElementById('filas-configuracion');
            filasCont.innerHTML = "";

            if (configGuardada && Array.isArray(configGuardada) && configGuardada.length > 0) {
                configGuardada.forEach(item => {
                    agregarFilaConfig(item.colIndex, item.conTitulo ? "SI" : "NO");
                });
            } else {
                agregarFilaConfig();
            }

            const filasQRCont = document.getElementById('filas-configuracion-qr');
            filasQRCont.innerHTML = "";

            if (camposQRGuardados && Array.isArray(camposQRGuardados) && camposQRGuardados.length > 0) {
                camposQRGuardados.forEach(item => {
                    if (typeof item === "object") {
                        agregarFilaQR(item.colIndex, item.conTitulo ? "SI" : "NO");
                    } else {
                        agregarFilaQR(item, "SI");
                    }
                });
            } else {
                agregarFilaQR();
            }
        });
    });
}

function renderSelectorCamposQR(camposQRGuardados = []) {
    const cont = document.getElementById('selector-campos-qr');
    if (!cont || !window.headersActuales) return;

    cont.innerHTML = "";

    window.headersActuales.forEach((header, index) => {
        const checked = camposQRGuardados.length === 0
            ? "checked"
            : (camposQRGuardados.includes(String(index)) || camposQRGuardados.includes(index) ? "checked" : "");

        cont.innerHTML += `
            <label style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-size:11px; color:#ddd;">
                <input type="checkbox" class="chk-campo-qr" value="${index}" ${checked} onchange="actualizarPreviewLive()">
                <span>${header}</span>
            </label>
        `;
    });
}

function agregarFilaConfig(colIndex = "", conTitulo = "NO") {
    const contenedor = document.getElementById('filas-configuracion');
    const div = document.createElement('div');
    div.className = "fila-etiqueta";
    div.style = "display:flex; gap:5px; margin-bottom:5px;";

    let ops = window.headersActuales.map((h, i) => {
        const selected = String(colIndex) === String(i) ? "selected" : "";
        return `<option value="${i}" ${selected}>${h}</option>`;
    }).join('');

    div.innerHTML = `
        <select class="sel-col-et" style="flex:2" onchange="actualizarPreviewLive()">${ops}</select>
        <select class="sel-tit-et" style="flex:1" onchange="actualizarPreviewLive()">
            <option value="NO" ${conTitulo === "NO" ? "selected" : ""}>SIN TÍTULO</option>
            <option value="SI" ${conTitulo === "SI" ? "selected" : ""}>CON TÍTULO</option>
        </select>
        <button onclick="this.parentElement.remove(); actualizarPreviewLive();" style="background:#c0392b; width:40px; margin:0;">X</button>
    `;

    contenedor.appendChild(div);
    actualizarPreviewLive();
}

function agregarFilaQR(colIndex = "", conTitulo = "SI") {
    const contenedor = document.getElementById('filas-configuracion-qr');
    const div = document.createElement('div');
    div.className = "fila-qr";
    div.style = "display:flex; gap:5px; margin-bottom:5px;";

    let ops = window.headersActuales.map((h, i) => {
        const selected = String(colIndex) === String(i) ? "selected" : "";
        return `<option value="${i}" ${selected}>${h}</option>`;
    }).join('');

    div.innerHTML = `
        <select class="sel-col-qr" style="flex:2" onchange="actualizarPreviewLive()">${ops}</select>
        <select class="sel-tit-qr" style="flex:1" onchange="actualizarPreviewLive()">
            <option value="NO" ${conTitulo === "NO" ? "selected" : ""}>SIN TÍTULO</option>
            <option value="SI" ${conTitulo === "SI" ? "selected" : ""}>CON TÍTULO</option>
        </select>
        <button onclick="this.parentElement.remove(); actualizarPreviewLive();" style="background:#c0392b; width:40px; margin:0;">X</button>
    `;

    contenedor.appendChild(div);
    actualizarPreviewLive();
}

function actualizarPreviewLive() {
    if (!piezaDeMuestra) return;

    const cont = document.getElementById('etiqueta-preview-live');
    const filasConfig = Array.from(document.querySelectorAll('.fila-etiqueta'));
    const filasQR = Array.from(document.querySelectorAll('.fila-qr'));
    const tipoCodigo = document.getElementById('sel-tipo-codigo')?.value || "BARRAS";

    let htmlCampos = "";

    filasConfig.forEach(fila => {
        const idx = fila.querySelector('.sel-col-et').value;
        const conTit = fila.querySelector('.sel-tit-et').value === "SI";
        const nombreCol = window.headersActuales[idx];
        const valor = piezaDeMuestra[idx];

        htmlCampos += `<div>${conTit ? nombreCol + ': ' : ''}<b>${valor}</b></div>`;
    });

    if (tipoCodigo === "BARRAS") {
        cont.innerHTML = `${htmlCampos}<svg id="bar-preview-live"></svg>`;

        JsBarcode("#bar-preview-live", piezaDeMuestra[4], {
            format: "CODE128",
            height: 30,
            displayValue: true,
            fontSize: 10
        });
    } else {
        let textoQR = "";

        filasQR.forEach(fila => {
            const idx = fila.querySelector('.sel-col-qr').value;
            const conTit = fila.querySelector('.sel-tit-qr').value === "SI";
            const nombreCol = window.headersActuales[idx];
            const valor = piezaDeMuestra[idx];

            textoQR += `${conTit ? nombreCol + ': ' : ''}${valor}\n`;
        });

        cont.innerHTML = `${htmlCampos}<div id="qr-preview-live" style="margin-top:10px; display:flex; justify-content:center;"></div>`;

        new QRCode(document.getElementById("qr-preview-live"), {
            text: textoQR.trim(),
            width: 120,
            height: 120
        });
    }
}

function guardarDisenoMaestro() {
    const filas = Array.from(document.querySelectorAll('.fila-etiqueta'));
    const filasQR = Array.from(document.querySelectorAll('.fila-qr'));
    const tipoCodigo = document.getElementById('sel-tipo-codigo')?.value || "BARRAS";

    const campos = filas.map(f => ({
        colIndex: f.querySelector('.sel-col-et').value,
        conTitulo: f.querySelector('.sel-tit-et').value === "SI"
    }));

    const camposQR = filasQR.map(f => ({
        colIndex: f.querySelector('.sel-col-qr').value,
        conTitulo: f.querySelector('.sel-tit-qr').value === "SI"
    }));

    const config = {
        tipoCodigo: tipoCodigo,
        campos: campos,
        camposQR: camposQR
    };

    callServer("guardarConfiguracionMaestra", { config: JSON.stringify(config) }, res => alert(res.msj));
}

function imprimirLoteCompleto(idProy) {
    const cont = document.getElementById('contenedor-etiquetas-lote');
    const btnImprimir = document.getElementById('btn-imprimir-ahora-lote');

    cont.innerHTML = `<div style="padding:12px; color:#2fc95c; font-weight:bold;">⏳ Generando etiquetas...</div>`;
    btnImprimir.classList.add('hidden');

    callServer("obtenerConfiguracionMaestra", {}, configJ => {
        const plantilla = JSON.parse(configJ);
        const tipoCodigo = Array.isArray(plantilla) ? "BARRAS" : (plantilla.tipoCodigo || "BARRAS");
        const configVisibles = Array.isArray(plantilla) ? plantilla : (plantilla.campos || []);
        const configQR = Array.isArray(plantilla) ? plantilla : (plantilla.camposQR || []);

        callServer("listaGestion", { type: "PIEZAS_PROYECTO", id: idProy, tipo: "PIEZAS_PROYECTO" }, res => {
            cont.innerHTML = "";

            if (res.status === "ERROR") {
                cont.innerHTML = `<div style="padding:12px; color:#ff6b6b; font-weight:bold;">❌ ${res.msj}</div>`;
                return;
            }

            if (!res.piezas || res.piezas.length === 0) {
                cont.innerHTML = "❌ No se encontraron piezas para ese proyecto.";
                return;
            }

            res.piezas.forEach((p, i) => {
                let html = "";
                let textoQR = "";

                configVisibles.forEach(item => {
                    const nombreCol = res.encabezados[item.colIndex];
                    const valor = p[item.colIndex] ?? "";
                    html += `<div>${item.conTitulo ? nombreCol + ': ' : ''}<b>${valor}</b></div>`;
                });

                if (tipoCodigo === "QR") {
                    configQR.forEach(item => {
                        const nombreCol = res.encabezados[item.colIndex];
                        const valor = p[item.colIndex] ?? "";
                        textoQR += `${item.conTitulo ? nombreCol + ': ' : ''}${valor}\n`;
                    });
                }

                const div = document.createElement('div');
                div.className = "etiqueta-preview";

                if (tipoCodigo === "BARRAS") {
                    div.innerHTML = `${html}<svg id="bar-gen-${i}"></svg>`;
                    cont.appendChild(div);

                    JsBarcode(`#bar-gen-${i}`, p[4], {
                        format: "CODE128",
                        height: 40,
                        displayValue: true,
                        fontSize: 10
                    });
                } else {
                    div.innerHTML = `${html}<div id="qr-gen-${i}" style="margin-top:10px; display:flex; justify-content:center;"></div>`;
                    cont.appendChild(div);

                    try {
                        new QRCode(document.getElementById(`qr-gen-${i}`), {
                            text: textoQR.trim(),
                            width: 120,
                            height: 120
                        });
                    } catch (e) {
                        console.error(`Error generando QR para la pieza ${p[4]}:`, e);
                        document.getElementById(`qr-gen-${i}`).innerHTML =
                            `<div style="padding:8px; border:1px solid #c00; color:#c00; font-size:12px; text-align:center;">
                                QR demasiado largo<br>${p[4]}
                             </div>`;
                    }
                }
            });

            btnImprimir.classList.remove('hidden');
        });
    });
}

function resetearPlantillaEtiquetas() {
    if (!confirm("⚠️ Vas a borrar la plantilla actual. ¿Continuar?")) return;

    callServer("guardarConfiguracionMaestra", { config: "" }, res => {
        piezaDeMuestra = null;
        document.getElementById('config-campos-etiqueta').innerHTML = `
            <div style="margin-bottom:10px; padding:8px; border-radius:8px; background:rgba(241, 196, 15, 0.12); color:#f1c40f; font-size:11px;">
                ℹ️ Plantilla eliminada. Buscá nuevamente un proyecto para crear una nueva.
            </div>
        `;
        document.getElementById('etiqueta-preview-live').innerHTML = "";
        alert("🧹 Plantilla eliminada. Podés crear una nueva.");
    });
}

function cargarSelectoresProyectos(callback) {
    callServer("obtenerListaProyectos", {}, res => {
        const selectDiseno = document.getElementById("id-proy-print");
        const selectLote = document.getElementById("id-proy-lote");

        if (selectDiseno) {
            selectDiseno.innerHTML = '<option value="">Seleccionar proyecto...</option>';
        }

        if (selectLote) {
            selectLote.innerHTML = '<option value="">Seleccionar proyecto...</option>';
        }

        if (res.status === "ERROR") {
            if (selectDiseno) {
                selectDiseno.innerHTML = '<option value="">Error al cargar proyectos</option>';
            }
            if (selectLote) {
                selectLote.innerHTML = '<option value="">Error al cargar proyectos</option>';
            }
            alert(res.msj);
            return;
        }

        if (!res.proyectos || res.proyectos.length === 0) {
            if (selectDiseno) {
                selectDiseno.innerHTML = '<option value="">No hay proyectos cargados</option>';
            }
            if (selectLote) {
                selectLote.innerHTML = '<option value="">No hay proyectos cargados</option>';
            }
            if (callback) callback();
            return;
        }

        res.proyectos.forEach(proy => {
            const fechaObj = new Date(proy.fecha);
            const fechaTexto = isNaN(fechaObj.getTime())
                ? proy.fecha
                : fechaObj.toLocaleString("es-AR");

            const texto = `${proy.id} — ${fechaTexto}`;

            if (selectDiseno) {
                const op1 = document.createElement("option");
                op1.value = proy.id;
                op1.textContent = texto;
                selectDiseno.appendChild(op1);
            }

            if (selectLote) {
                const op2 = document.createElement("option");
                op2.value = proy.id;
                op2.textContent = texto;
                selectLote.appendChild(op2);
            }
        });

        if (callback) callback();
    });
}

function abrirDisenoEtiquetas() {
    cargarSelectoresProyectos(() => {
        mostrar('pantalla-impresion');
    });
}

function abrirImpresionLote() {
    cargarSelectoresProyectos(() => {
        cargarFormatosImpresion();
        mostrar('pantalla-lote');
    });
}

function lanzarImpresionLote() {
   const contenedorOriginal = document.getElementById('contenedor-etiquetas-lote');
const contenido = contenedorOriginal.innerHTML;
const etiquetas = Array.from(contenedorOriginal.querySelectorAll('.etiqueta-preview'));
    const selectFormato = document.getElementById('formato-impresion-lote');

    if (!contenido || contenido.trim() === "") {
        alert("Primero generá el lote.");
        return;
    }

    if (!selectFormato || !selectFormato.options.length || !selectFormato.value && selectFormato.selectedIndex <= 0) {
        alert("Seleccioná un formato de impresión.");
        return;
    }

    const valorSeleccionado = (selectFormato.value || "").trim();
    const textoSeleccionado = (selectFormato.options[selectFormato.selectedIndex]?.textContent || "").trim();

    callServer("obtenerFormatosImpresion", {}, res => {
        if (res.status === "ERROR") {
            alert(res.msj);
            return;
        }

        if (!res.formatos || res.formatos.length === 0) {
            alert("No hay formatos cargados.");
            return;
        }

        let formato = null;

        if (valorSeleccionado !== "") {
            formato = res.formatos.find(f =>
                String(f.codigo || "").trim() === valorSeleccionado ||
                String(f.nombre || "").trim() === valorSeleccionado
            );
        }

        if (!formato) {
            const match = textoSeleccionado.match(/([\d.]+)\s*x\s*([\d.]+).*?\((\d+)/i);
            if (match) {
                const anchoTxt = Number(match[1]);
                const altoTxt = Number(match[2]);
                const cantidadTxt = Number(match[3]);

                formato = res.formatos.find(f =>
                    Number(f.ancho) === anchoTxt &&
                    Number(f.alto) === altoTxt &&
                    Number(f.cantidad) === cantidadTxt
                );
            }
        }

        if (!formato) {
            alert("No se pudo identificar el formato seleccionado.");
            return;
        }
        const cantidadPorPagina = Number(formato.cantidad) || 16;

let paginasHTML = "";

for (let i = 0; i < etiquetas.length; i += cantidadPorPagina) {
    const bloque = etiquetas.slice(i, i + cantidadPorPagina)
        .map(el => el.outerHTML)
        .join("");

    paginasHTML += `
        <div class="pagina-etiquetas">
            <div class="contenedor-lote">
                ${bloque}
            </div>
        </div>
    `;
}

        const anchoMm = Number(formato.ancho) || 99.1;
        const altoMm = Number(formato.alto) || 57;
        const columnas = Number(formato.columnas) || 1;

        const ventanaPrint = window.open('', '_blank');

        ventanaPrint.document.write(`
            <html>
            <head>
                <title>Imprimir lote de etiquetas</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
.pagina-etiquetas {
    width: 210mm;
    height: 297mm;
    page-break-after: always;
    break-after: page;
    overflow: hidden;
}

.pagina-etiquetas:last-child {
    page-break-after: auto;
    break-after: auto;
}
                    html, body {
                        margin: 0;
                        padding: 0;
                        background: white;
                        font-family: Arial, sans-serif;
                    }

                    .contenedor-lote {
    width: 210mm;
    min-height: 297mm;
    margin: 0;
    padding-left: ${formato.margenIzquierdo}mm;
    padding-top: ${formato.margenSuperior}mm;
    box-sizing: border-box;

    display: grid;
    grid-template-columns: repeat(${columnas}, ${anchoMm}mm);
    grid-auto-rows: ${altoMm}mm;

    column-gap: ${formato.pasoHorizontal - anchoMm}mm;
    row-gap: ${formato.pasoVertical - altoMm}mm;

    justify-content: start;
    align-content: start;
}
                    }

                    .etiqueta-preview {
                        width: ${anchoMm}mm;
                        height: ${altoMm}mm;
                        box-sizing: border-box;
                        overflow: hidden;
                        background: white;
                        color: black;
                        border: 1px solid #000;
                        border-radius: 0;
                        margin: 0;
                        padding: 2mm;
                        text-align: center;
                        page-break-inside: avoid;
                        break-inside: avoid;
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-start;
                        align-items: center;
                    }

                    .etiqueta-preview div {
                        width: 100%;
                        box-sizing: border-box;
                        word-break: break-word;
                        overflow-wrap: break-word;
                        line-height: 1.1;
                        margin-bottom: 1mm;
                        font-size: 10pt;
                    }

                    .etiqueta-preview svg {
                        max-width: 100%;
                        height: auto;
                    }

                    .etiqueta-preview img,
                    .etiqueta-preview canvas {
                        max-width: 100%;
                        max-height: calc(${altoMm}mm - 18mm);
                        height: auto;
                    }
                </style>
            </head>
            <body onload="window.print(); window.close();">
                ${paginasHTML}
            </body>
            </html>
        `);

        ventanaPrint.document.close();
    });
}

function cargarFormatosImpresion() {
    const select = document.getElementById("formato-impresion-lote");

    if (!select) return;

    select.innerHTML = '<option value="">Cargando formatos...</option>';

    callServer("obtenerFormatosImpresion", {}, res => {
        if (res.status === "ERROR") {
            select.innerHTML = '<option value="">Error al cargar formatos</option>';
            alert(res.msj);
            return;
        }

        if (!res.formatos || res.formatos.length === 0) {
            select.innerHTML = '<option value="">No hay formatos cargados</option>';
            return;
        }

        select.innerHTML = '<option value="">Seleccionar formato...</option>';

        res.formatos.forEach(f => {
            const texto = `${f.codigo} — ${f.ancho} x ${f.alto} (${f.cantidad} por hoja)`;

            const op = document.createElement("option");
            op.value = f.codigo;
            op.textContent = texto;

            select.appendChild(op);
        });
    });
}
