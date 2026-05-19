console.log("js_estaciones cargado OK");

function guardarEstacion() {
    const nombre = document.getElementById("est-nombre").value.trim();
    const descripcion = document.getElementById("est-desc").value.trim();

    if (!nombre) {
        alert("Ingresá el nombre de la estación.");
        return;
    }

    callServer("crearEstacion", {
        nombre: nombre,
        descripcion: descripcion
        }, res => {
        console.log("Respuesta crear estación:", res);
        alert(res.msj || res.message || res.status || JSON.stringify(res));

        document.getElementById("est-nombre").value = "";
        document.getElementById("est-desc").value = "";

        mostrar("pantalla-menu");
    });
