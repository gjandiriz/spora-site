console.log("js_usuarios cargado OK");

function guardarUsuario() {
    const d = { 
        legajo: document.getElementById('u-legajo').value, 
        nombre: document.getElementById('u-nombre').value, 
        pin: document.getElementById('u-pin').value, 
        rol: document.getElementById('u-rol').value 
    };
    
    callServer("crearNuevoUsuario", d, res => { 
        alert(res.status); 
        if(res.status === "OK") mostrar('pantalla-menu'); 
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
