//--------- EVENTOS ---------

$(document).on("click", "#btn-test-notification", function () {
  notificar("Pura vida pa!");
});

$(document).on("submit", "#formPersona", function (event) {
  event.preventDefault();

  let item = {
    nombre: $("#nombre").val(),
    telefono: $("#telefono").val(),
    correo: $("#correo").val(),
  };

  let id = Number($("#id_persona").val());

  if (id == 0) {
    store(item);
  } else {
    item.id = id;
    update(item);
  }
});

$(document).on("click", "#btn-clear", function () {
  clearForm();
});

$(document).on("click", ".btn-edit", function () {
  let item = $(this).data("item");
  $("#nombre").val(item.nombre);
  $("#telefono").val(item.telefono);
  $("#correo").val(item.correo);
  $("#id_persona").val(item.id);
});

$(document).on("click", ".btn-destroy", function () {
  let id = $(this).data("id");
  destroy(id);
});

$(document).on("input", "#buscar", function () {
  const texto = $(this).val().toLowerCase();
  $("#tablaPersonas tr").each(function () {
    $(this).toggle($(this).text().toLowerCase().includes(texto));
  });
});

//--------- DB ---------

let db;
conexion();

function conexion() {
  const solicitud = indexedDB.open("db_personas", 1);

  solicitud.onupgradeneeded = function (event) {
    db = event.target.result;

    db.createObjectStore("personas", {
      keyPath: "id",
      autoIncrement: true,
    });
  };

  solicitud.onsuccess = function (event) {
    db = event.target.result;
    loadTable();
  };

  solicitud.onerror = function () {
    console.log("Error al abrir la base de datos");
  };
}

//--------- CRUD ---------

//Añadir
function store(item) {
  const tx = db.transaction("personas", "readwrite");//transaciones
  const personas = tx.objectStore("personas");
  personas.add(item);

  tx.oncomplete = function () {
    clearForm();
    loadTable();
    notificar("Registrado: " + item.nombre);
  };
}


//Actualizar
function update(item) {
  const tx = db.transaction("personas", "readwrite");
  const personas = tx.objectStore("personas");

  personas.put(item);

  tx.oncomplete = function () {
    clearForm();
    loadTable();
    notificar("Actualizado: " + item.nombre);
  };
}


//Borrar
function destroy(id) {
  if (!confirm("¿Desea eliminar este registro?")) {
    return;
  }

  const tx = db.transaction("personas", "readwrite");
  const personas = tx.objectStore("personas");

  personas.delete(id);

  tx.oncomplete = function () {
    loadTable();
    notificar("Registro Eliminado: ");
  };
}

//todo
function all() {
  return new Promise(function (resolve, reject) {
    const tx = db.transaction("personas", "readonly");
    const personas = tx.objectStore("personas");

    const solicitud = personas.getAll();

    solicitud.onsuccess = function () {
      resolve(solicitud.result);
    };

    solicitud.onerror = function () {
      reject(solicitud.error);
    };
  });
}

//consulat por id
function find(id) {
  return new Promise(function (resolve, reject) {
    const tx = db.transaction("personas", "readonly");
    const personas = tx.objectStore("personas");

    const solicitud = personas.get(id);//llama con get

    solicitud.onsuccess = function () {
      resolve(solicitud.result);
    };

    solicitud.onerror = function () {
      reject(solicitud.error);
    };
  });
}

//--------- VIEWS ---------

function clearForm() {
  $("#formPersona")[0].reset();
  $("#id_persona").val(0);
}

async function loadTable() {

  const data = await all(); // en espera de la conexión async all()

  $("#tablaPersonas").empty();

  data.forEach(function (item) {
    $("#tablaPersonas").append(`
                <tr>
                    <td>${item.nombre}</td>
                    <td>${item.telefono}</td>
                    <td>${item.correo}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-edit" data-item='${JSON.stringify(item)}'>
                            Editar
                        </button>
                        <button class="btn btn-sm btn-danger btn-destroy" data-id="${item.id}">
                            Eliminar
                        </button>
                    </td>
                </tr>
            `);
  });
}

//--------- NOTIFICACIONES ---------
self.addEventListener("notificationclick", function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow("/")
    );
});


async function notificar(mensaje) {
  try {
    if (Notification.permission !== "granted") return;

    const registro = await navigator.serviceWorker.ready;

    await registro.showNotification("Personas PWA", {
      body: mensaje,
      icon: "/icons/icon512_rounded.png"
    });

  } catch (error) {
    console.error("Error al notificar:", error);
  }
}



//--------- STATUS CONEXION ---------

$(document).ready(function () {
  showConnectivityStatus();
});

function showConnectivityStatus() {
  let isOnline = navigator.onLine;
  let status = $("#onlineStatus");

  if (!isOnline) {
    status.html("Offline");
  }

  window.addEventListener("online", () => {
    status.html("Online.");
    isOnline = true;
  });

  window.addEventListener("offline", () => {
    status.html("Offline.");
    isOnline = false;
  });
}
