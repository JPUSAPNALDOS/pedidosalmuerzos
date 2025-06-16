const API_URL_BASE = "https://sheetdb.io/api/v1/eywhbd01uz59s";
const API_URL_NOMBRES = API_URL_BASE + "?sheet=Nombres";
const API_URL_PEDIDOS = API_URL_BASE + "?sheet=Pedidos";

function apiMenusSemana(semana) {
  return API_URL_BASE + `?sheet=${semana}`;
}

function normaliza(str) {
  return (str || "")
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase();
}

// Loader
function mostrarLoader() {
  document.getElementById('loader').style.display = '';
}
function ocultarLoader() {
  document.getElementById('loader').style.display = 'none';
}

// Variables para edición y filtros
let todosLosPedidos = [];
let modoEdicion = false;
let idEditar = null;

// Nombres para autocompletar
async function cargarNombres() {
  mostrarLoader();
  const response = await fetch(API_URL_NOMBRES);
  const data = await response.json();
  ocultarLoader();
  const dataList = document.getElementById('nombresList');
  dataList.innerHTML = '';
  data.forEach(row => {
    if(row.Nombre && row.Nombre.trim() !== "") {
      dataList.innerHTML += `<option value="${row.Nombre}">`;
    }
  });
}

// Menú, Entrada y Postre del día según semana y día (robusto)
async function cargarMenuPorSemanaYDia() {
  mostrarLoader();
  const semana = document.getElementById('semana').value;
  const dia = document.getElementById('dia').value;
  const response = await fetch(apiMenusSemana(semana));
  const data = await response.json();
  ocultarLoader();
  const menuDelDia = data.find(row => normaliza(row.Día) === normaliza(dia));
  document.getElementById('menu').value = menuDelDia ? menuDelDia.Menú : '';
  document.getElementById('entrada').value = menuDelDia ? menuDelDia.Entrada : '';
  document.getElementById('postre').value = menuDelDia ? menuDelDia.Postre : '';
}

document.getElementById('semana').addEventListener('change', cargarMenuPorSemanaYDia);
document.getElementById('dia').addEventListener('change', cargarMenuPorSemanaYDia);

window.addEventListener('DOMContentLoaded', () => {
  cargarNombres();
  cargarMenuPorSemanaYDia();
  cargarPedidosYMostrar();
});

// REGISTRO / EDICIÓN de pedido
document.getElementById('pedidoForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value;
  const semana = document.getElementById('semana').value;
  const dia = document.getElementById('dia').value;
  const menu = document.getElementById('menu').value;
  const entrada = document.getElementById('entrada').value;
  const postre = document.getElementById('postre').value;
  const observaciones = document.getElementById('obs').value;
  const fechaHoy = new Date().toISOString().split('T')[0];
  const msg = document.getElementById('msg');

  msg.style.color = "black";
  mostrarLoader();

  if (!modoEdicion) {
    // REGISTRO NUEVO
    msg.textContent = "Enviando pedido...";
    const nuevoID = Date.now().toString();
    try {
      const response = await fetch(API_URL_PEDIDOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [{
            ID: nuevoID,
            Nombre: nombre,
            Semana: semana,
            Día: dia,
            Menú: menu,
            Entrada: entrada,
            Postre: postre,
            Observaciones: observaciones,
            Fecha: fechaHoy
          }]
        })
      });
      ocultarLoader();
      if (response.ok) {
        msg.style.color = "green";
        msg.textContent = "¡Pedido registrado exitosamente!";
        this.reset();
        modoEdicion = false;
        idEditar = null;
        document.querySelector('button[type="submit"]').textContent = "Registrar Pedido";
        document.getElementById('cancelarEdicion') && (document.getElementById('cancelarEdicion').style.display = 'none');
        cargarMenuPorSemanaYDia();
        cargarPedidosYMostrar();
      } else {
        msg.style.color = "red";
        msg.textContent = "Error al registrar pedido.";
      }
    } catch (err) {
      ocultarLoader();
      msg.style.color = "red";
      msg.textContent = "Error de conexión. Intenta de nuevo.";
    }
  } else {
    // MODO EDICIÓN: PATCH (¡USANDO SOLO API_URL_BASE!)
    msg.textContent = "Guardando cambios...";
    try {
      const response = await fetch(API_URL_BASE + `/ID/${idEditar}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            Nombre: nombre,
            Semana: semana,
            Día: dia,
            Menú: menu,
            Entrada: entrada,
            Postre: postre,
            Observaciones: observaciones,
            Fecha: fechaHoy
          }
        })
      });
      ocultarLoader();
      if (response.ok) {
        msg.style.color = "green";
        msg.textContent = "¡Pedido actualizado exitosamente!";
        this.reset();
        modoEdicion = false;
        idEditar = null;
        document.querySelector('button[type="submit"]').textContent = "Registrar Pedido";
        document.getElementById('cancelarEdicion') && (document.getElementById('cancelarEdicion').style.display = 'none');
        cargarMenuPorSemanaYDia();
        cargarPedidosYMostrar();
      } else {
        msg.style.color = "red";
        msg.textContent = "Error al actualizar el pedido.";
      }
    } catch (err) {
      ocultarLoader();
      msg.style.color = "red";
      msg.textContent = "Error de conexión. Intenta de nuevo.";
    }
  }
});

// Cancelar edición (opcional, solo si agregaste el botón en el HTML)
if (document.getElementById('cancelarEdicion')) {
  document.getElementById('pedidoForm').addEventListener('input', function() {
    if (modoEdicion) document.getElementById('cancelarEdicion').style.display = '';
  });
  document.getElementById('cancelarEdicion').addEventListener('click', function() {
    document.getElementById('pedidoForm').reset();
    modoEdicion = false;
    idEditar = null;
    document.querySelector('button[type="submit"]').textContent = "Registrar Pedido";
    document.getElementById('msg').textContent = '';
    this.style.display = 'none';
  });
}

// PEDIR TODA LA SEMANA (con confirmación)
document.getElementById('pedirSemanaCompleta').addEventListener('click', async function() {
  const nombre = document.getElementById('nombre').value;
  const semana = document.getElementById('semana').value;
  const observaciones = document.getElementById('obs').value;
  const msg = document.getElementById('msg');
  
  if (!nombre || !semana) {
    msg.style.color = "red";
    msg.textContent = "Selecciona nombre y semana.";
    return;
  }

  if (!confirm("¿Seguro que quieres registrar los pedidos para toda la semana?")) return;
  
  mostrarLoader();

  try {
    const response = await fetch(apiMenusSemana(semana));
    const menusSemana = await response.json();
    const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    const fechaHoy = new Date().toISOString().split('T')[0];
    const pedidosSemana = dias.map(dia => {
      const menuDia = menusSemana.find(row => normaliza(row.Día) === normaliza(dia)) || {};
      return {
        ID: Date.now() + Math.floor(Math.random() * 10000),
        Nombre: nombre,
        Semana: semana,
        Día: dia,
        Menú: menuDia.Menú || "",
        Entrada: menuDia.Entrada || "",
        Postre: menuDia.Postre || "",
        Observaciones: observaciones,
        Fecha: fechaHoy
      };
    });

    const postResponse = await fetch(API_URL_PEDIDOS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: pedidosSemana })
    });
    ocultarLoader();

    if (postResponse.ok) {
      msg.style.color = "green";
      msg.textContent = "¡Pedido registrado para toda la semana!";
      document.getElementById('pedidoForm').reset();
      modoEdicion = false;
      idEditar = null;
      document.querySelector('button[type="submit"]').textContent = "Registrar Pedido";
      document.getElementById('cancelarEdicion') && (document.getElementById('cancelarEdicion').style.display = 'none');
      cargarMenuPorSemanaYDia();
      cargarPedidosYMostrar();
    } else {
      msg.style.color = "red";
      msg.textContent = "Error al registrar pedido semanal.";
    }
  } catch (err) {
    ocultarLoader();
    msg.style.color = "red";
    msg.textContent = "Error de conexión. Intenta de nuevo.";
  }
});

// Cargar y mostrar todos los pedidos (para filtro)
async function cargarPedidosYMostrar() {
  mostrarLoader();
  const response = await fetch(API_URL_PEDIDOS);
  const data = await response.json();
  ocultarLoader();
  todosLosPedidos = Array.isArray(data) ? data : [];
  mostrarPedidosFiltrados();
}

// Filtros extra
document.getElementById('filtroFecha').addEventListener('input', mostrarPedidosFiltrados);
document.getElementById('filtroNombre').addEventListener('input', mostrarPedidosFiltrados);
document.getElementById('filtroSemana').addEventListener('change', mostrarPedidosFiltrados);
document.getElementById('filtroDia').addEventListener('change', mostrarPedidosFiltrados);

// Mostrar pedidos con filtros activos
function mostrarPedidosFiltrados() {
  const filtroFecha = document.getElementById('filtroFecha').value;
  const filtroNombre = normaliza(document.getElementById('filtroNombre').value);
  const filtroSemana = document.getElementById('filtroSemana').value;
  const filtroDia = document.getElementById('filtroDia').value;

  let filtrados = todosLosPedidos;

  if (filtroFecha) {
    filtrados = filtrados.filter(p => p.Fecha === filtroFecha);
  }
  if (filtroNombre) {
    filtrados = filtrados.filter(p => normaliza(p.Nombre).includes(filtroNombre));
  }
  if (filtroSemana) {
    filtrados = filtrados.filter(p => p.Semana === filtroSemana);
  }
  if (filtroDia) {
    filtrados = filtrados.filter(p => p.Día === filtroDia);
  }

  let html = '';
  if (filtrados.length === 0) {
    html = '<div style="text-align:center; color:#888; margin-top:20px;">No hay pedidos registrados con este filtro</div>';
  } else {
    html = `<div class="tarjetas-contenedor">` + filtrados.map(pedido => `
      <div class="tarjeta-pedido" style="position:relative;">
        <div class="pedido-acciones">
          <button class="btn-editar" title="Editar" data-id="${pedido.ID}">✏️</button>
          <button class="btn-imprimir" title="Imprimir" data-id="${pedido.ID}">🖨️</button>
          <button class="btn-borrar" title="Borrar" data-id="${pedido.ID}">🗑️</button>
        </div>
        <div class="tp-nombre"><b>${pedido.Nombre}</b></div>
        <div class="tp-detalle"><b>Semana:</b> ${pedido.Semana.replace('Menus_', '').replace('_', ' ')}</div>
        <div class="tp-detalle"><b>Día:</b> ${pedido.Día}</div>
        <div class="tp-detalle"><b>Menú:</b> ${pedido.Menú}</div>
        <div class="tp-detalle"><b>Entrada:</b> ${pedido.Entrada ? pedido.Entrada : '-'}</div>
        <div class="tp-detalle"><b>Postre:</b> ${pedido.Postre ? pedido.Postre : '-'}</div>
        <div class="tp-detalle"><b>Obs:</b> ${pedido.Observaciones ? pedido.Observaciones : '-'}</div>
      </div>
    `).join('') + '</div>';
  }
  document.getElementById('listaPedidos').innerHTML = html;
}

// Delegación de eventos para botones flotantes
document.getElementById('listaPedidos').addEventListener('click', async function(e) {
  const btn = e.target.closest('button');
  if (!btn) return;
  const pedidoId = btn.dataset.id;
  if (btn.classList.contains('btn-borrar')) {
    if (confirm("¿Seguro de borrar este pedido?")) {
      await fetch(API_URL_BASE + `/ID/${pedidoId}`, { method: "DELETE" });
      todosLosPedidos = todosLosPedidos.filter(p => p.ID !== pedidoId);
      mostrarPedidosFiltrados();
    }
  } else if (btn.classList.contains('btn-imprimir')) {
    imprimirUnPedido(pedidoId);
  } else if (btn.classList.contains('btn-editar')) {
    const pedido = todosLosPedidos.find(p => p.ID === pedidoId);
    if (!pedido) return;
    document.getElementById('nombre').value = pedido.Nombre;
    document.getElementById('semana').value = pedido.Semana;
    document.getElementById('dia').value = pedido.Día;
    await cargarMenuPorSemanaYDia();
    document.getElementById('menu').value = pedido.Menú;
    document.getElementById('entrada').value = pedido.Entrada;
    document.getElementById('postre').value = pedido.Postre;
    document.getElementById('obs').value = pedido.Observaciones || '';
    modoEdicion = true;
    idEditar = pedido.ID;
    document.querySelector('button[type="submit"]').textContent = "Guardar Cambios";
    document.getElementById('msg').textContent = "Editando pedido...";
    document.getElementById('msg').style.color = "#1c3864";
    document.getElementById('cancelarEdicion') && (document.getElementById('cancelarEdicion').style.display = '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// Imprimir UN pedido (abre ventana temporal)
function imprimirUnPedido(id) {
  const pedido = todosLosPedidos.find(p => p.ID === id);
  if (!pedido) return;
  const ticket = `
    <div style="font-family:Arial,sans-serif;max-width:80mm;padding:10px">
      <h3 style="text-align:left;font-size:1.1em">Pedido de Almuerzo</h3>
      <hr>
      <b>Nombre:</b> ${pedido.Nombre}<br>
      <b>Semana:</b> ${pedido.Semana.replace('Menus_', '').replace('_', ' ')}<br>
      <b>Día:</b> ${pedido.Día}<br>
      <b>Menú:</b> ${pedido.Menú}<br>
      <b>Entrada:</b> ${pedido.Entrada}<br>
      <b>Postre:</b> ${pedido.Postre}<br>
      <b>Observaciones:</b> ${pedido.Observaciones || '-'}<br>
      <b>Fecha:</b> ${pedido.Fecha}<br>
    </div>
  `;
  const w = window.open('', '', 'width=340,height=600');
  w.document.write(ticket);
  w.document.close();
  setTimeout(() => { w.print(); w.close(); }, 250);
}

// Imprimir pedidos filtrados
document.getElementById('imprimirPorDia').addEventListener('click', function() {
  const filtroFecha = document.getElementById('filtroFecha').value;
  const filtroNombre = normaliza(document.getElementById('filtroNombre').value);
  const filtroSemana = document.getElementById('filtroSemana').value;
  const filtroDia = document.getElementById('filtroDia').value;

  let filtrados = todosLosPedidos;
  if (filtroFecha) {
    filtrados = filtrados.filter(p => p.Fecha === filtroFecha);
  }
  if (filtroNombre) {
    filtrados = filtrados.filter(p => normaliza(p.Nombre).includes(filtroNombre));
  }
  if (filtroSemana) {
    filtrados = filtrados.filter(p => p.Semana === filtroSemana);
  }
  if (filtroDia) {
    filtrados = filtrados.filter(p => p.Día === filtroDia);
  }

  let html = '';
  if (filtrados.length === 0) {
    html = '<div style="text-align:center; color:#888; margin-top:20px;">No hay pedidos registrados con este filtro</div>';
  } else {
    html = `<div class="tarjetas-contenedor">` + filtrados.map(pedido => `
      <div class="tarjeta-pedido" style="position:relative;">
        <div class="tp-nombre"><b>${pedido.Nombre}</b></div>
        <div class="tp-detalle"><b>Semana:</b> ${pedido.Semana.replace('Menus_', '').replace('_', ' ')}</div>
        <div class="tp-detalle"><b>Día:</b> ${pedido.Día}</div>
        <div class="tp-detalle"><b>Menú:</b> ${pedido.Menú}</div>
        <div class="tp-detalle"><b>Entrada:</b> ${pedido.Entrada ? pedido.Entrada : '-'}</div>
        <div class="tp-detalle"><b>Postre:</b> ${pedido.Postre ? pedido.Postre : '-'}</div>
        <div class="tp-detalle"><b>Obs:</b> ${pedido.Observaciones ? pedido.Observaciones : '-'}</div>
      </div>
    `).join('') + '</div>';
  }
  // Mostrar solo la lista filtrada y lanzar impresión
  const backup = document.getElementById('listaPedidos').innerHTML;
  document.getElementById('listaPedidos').innerHTML = html;
  setTimeout(() => {
    window.print();
    document.getElementById('listaPedidos').innerHTML = backup;
  }, 200);
});
