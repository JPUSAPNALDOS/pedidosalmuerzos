// Cambia esta URL por tu endpoint único de SheetDB
const API_URL_BASE = "https://sheetdb.io/api/v1/eywhbd01uz59s";
const API_URL_NOMBRES = API_URL_BASE + "?sheet=Nombres";
const API_URL_PEDIDOS = API_URL_BASE + "?sheet=Pedidos";

function apiMenusSemana(semana) {
  return API_URL_BASE + `?sheet=${semana}`;
}

// Loader
function mostrarLoader() {
  document.getElementById('loader').style.display = '';
}
function ocultarLoader() {
  document.getElementById('loader').style.display = 'none';
}

// Cargar nombres para autocompletar
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

// Menú del día según semana y día
async function cargarMenuPorSemanaYDia() {
  mostrarLoader();
  const semana = document.getElementById('semana').value;
  const dia = document.getElementById('dia').value;
  const response = await fetch(apiMenusSemana(semana));
  const data = await response.json();
  ocultarLoader();
  const menuDelDia = data.find(row => row.Día === dia);
  document.getElementById('menu').value = menuDelDia ? menuDelDia.Menú : '';
}

document.getElementById('semana').addEventListener('change', cargarMenuPorSemanaYDia);
document.getElementById('dia').addEventListener('change', cargarMenuPorSemanaYDia);

// Carga inicial
window.addEventListener('DOMContentLoaded', () => {
  cargarNombres();
  cargarMenuPorSemanaYDia();
  cargarPedidosDelDia();
});

// Registrar pedido
document.getElementById('pedidoForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value;
  const semana = document.getElementById('semana').value;
  const dia = document.getElementById('dia').value;
  const menu = document.getElementById('menu').value;
  const observaciones = document.getElementById('obs').value;
  const fechaHoy = new Date().toISOString().split('T')[0];
  const msg = document.getElementById('msg');
  msg.style.color = "black";
  msg.textContent = "Enviando pedido...";
  mostrarLoader();

  try {
    const response = await fetch(API_URL_PEDIDOS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{
          Nombre: nombre,
          Semana: semana,
          Día: dia,
          Menú: menu,
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
      cargarMenuPorSemanaYDia();
      cargarPedidosDelDia();
    } else {
      msg.style.color = "red";
      msg.textContent = "Error al registrar pedido.";
    }
  } catch (err) {
    ocultarLoader();
    msg.style.color = "red";
    msg.textContent = "Error de conexión. Intenta de nuevo.";
  }
});

// Pedidos como tarjetas (HOY)
async function cargarPedidosDelDia() {
  mostrarLoader();
  const hoy = new Date().toISOString().split('T')[0];
  const response = await fetch(API_URL_PEDIDOS + `&search=Fecha:${hoy}`);
  const data = await response.json();
  ocultarLoader();

  let html = '';
  if (data.length === 0) {
    html = '<div style="text-align:center; color:#888; margin-top:20px;">No hay pedidos registrados hoy</div>';
  } else {
    html = `<div class="tarjetas-contenedor">` + data.map(pedido => `
      <div class="tarjeta-pedido">
        <div class="tp-nombre"><b>${pedido.Nombre}</b></div>
        <div class="tp-detalle"><b>Semana:</b> ${pedido.Semana.replace('Menus_', '').replace('_', ' ')}</div>
        <div class="tp-detalle"><b>Día:</b> ${pedido.Día}</div>
        <div class="tp-detalle"><b>Menú:</b> ${pedido.Menú}</div>
        <div class="tp-detalle"><b>Obs:</b> ${pedido.Observaciones ? pedido.Observaciones : '-'}</div>
      </div>
    `).join('') + '</div>';
  }
  document.getElementById('listaPedidos').innerHTML = html;
}

// Imprimir pedidos del día actual
document.getElementById('imprimirPedidos').addEventListener('click', function() {
  window.print();
});

// Exportar pedidos a CSV
document.getElementById('exportarPedidos').addEventListener('click', async function() {
  mostrarLoader();
  const hoy = new Date().toISOString().split('T')[0];
  const response = await fetch(API_URL_PEDIDOS + `&search=Fecha:${hoy}`);
  const data = await response.json();
  ocultarLoader();
  let csv = 'Nombre,Semana,Día,Menú,Observaciones\n';
  data.forEach(pedido => {
    csv += `"${pedido.Nombre}","${pedido.Semana}","${pedido.Día}","${pedido.Menú}","${pedido.Observaciones}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pedidos_${hoy}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// FILTRO: Imprimir pedidos por semana y día
document.getElementById('imprimirPorDia').addEventListener('click', async function() {
  const semana = document.getElementById('filtroSemana').value;
  const dia = document.getElementById('filtroDia').value;
  mostrarLoader();
  const response = await fetch(API_URL_PEDIDOS + `&search=Semana:${semana},Día:${dia}`);
  const data = await response.json();
  ocultarLoader();

  let html = '';
  if (data.length === 0) {
    html = '<div style="text-align:center; color:#888; margin-top:20px;">No hay pedidos registrados para ese filtro</div>';
  } else {
    html = `<div class="tarjetas-contenedor">` + data.map(pedido => `
      <div class="tarjeta-pedido">
        <div class="tp-nombre"><b>${pedido.Nombre}</b></div>
        <div class="tp-detalle"><b>Semana:</b> ${pedido.Semana.replace('Menus_', '').replace('_', ' ')}</div>
        <div class="tp-detalle"><b>Día:</b> ${pedido.Día}</div>
        <div class="tp-detalle"><b>Menú:</b> ${pedido.Menú}</div>
        <div class="tp-detalle"><b>Obs:</b> ${pedido.Observaciones ? pedido.Observaciones : '-'}</div>
      </div>
    `).join('') + '</div>';
  }
  document.getElementById('listaPedidos').innerHTML = html;
  setTimeout(() => window.print(), 200);
});
