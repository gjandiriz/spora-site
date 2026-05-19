console.log("js_usuarios cargado OK");

function guardarUsuario() {
    // 1. Buscamos el botón de guardar de forma dinámica para congelarlo
    // Buscamos un botón que esté cerca de los inputs de usuario o usamos el selector del contenedor
    const btn = document.querySelector("button[onclick='guardarUsuario()']");
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ Guardando...";
        btn.style.opacity = "0.6";
        btn.style.cursor = "not-allowed";
    }

    const d = { 
        legajo: document.getElementById('u-legajo').value, 
        nombre: document.getElementById('u-nombre').value, 
        pin: document.getElementById('u-pin').value, 
        rol: document.getElementById('u-rol').value 
    };
    
    callServer("crearNuevoUsuario", d, res => { 
        // 2. Liberamos el botón apenas el servidor responde (tanto si da OK como ERROR)
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = "GUARDAR USUARIO"; // Poné acá el texto exacto que tiene tu botón originalmente
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
        }

        // Si la respuesta es un error detallado (ej: "El legajo ya existe"), lo mostramos en el alert
        if (res.status === "OK") {
            alert("🚀 " + (res.msj || "Usuario creado con éxito."));
            mostrar('pantalla-menu'); 
        } else {
            alert("❌ Error: " + (res.msj || res.status));
        }
    });
}

function abrirGestorUsuarios() {
    callServer("obtenerListaUsuariosDetalle", {}, res => {
        const cont = document.getElementById('lista-gestor'); 
        cont.innerHTML = "";
        res.forEach(u => {
            cont.innerHTML += `
                <div class="item-lista">
                    <span>${u.nombre}</span>
                    <button onclick="borrarU('${u.legajo}')" style="width:auto; background:red;">X</button>
                </div>`;
        });
        mostrar('pantalla-gestor');
    });
}

function borrarU(l) { 
    if(confirm("¿Borrar usuario?")) {
        callServer("eliminarUsuario", {legajo: l}, () => abrirGestorUsuarios()); 
    }
}
