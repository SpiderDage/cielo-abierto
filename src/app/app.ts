import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type DatosClima = {
  temperature_2m: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  precipitation: number;
};

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  ciudad = 'Zacapa';
  ubicacion = signal('');
  clima = signal<DatosClima | null>(null);
  cargando = signal(false);
  mensaje = signal('');

  ngOnInit() {
    this.buscarClima();
  }

  async buscarClima() {
    const nombre = this.ciudad.trim();
    if (nombre === '') {
      this.mensaje.set('Escribe el nombre de una ciudad.');
      return;
    }

    this.cargando.set(true);
    this.mensaje.set('');

    try {
      // Buscamos las coordenadas de la ciudad.
      const urlCiudad = 'https://geocoding-api.open-meteo.com/v1/search?name=' +
        encodeURIComponent(nombre) + '&count=1&language=es';
      const respuestaCiudad = await fetch(urlCiudad);
      if (!respuestaCiudad.ok) throw new Error();

      const datosCiudad = await respuestaCiudad.json();
      if (!datosCiudad.results || datosCiudad.results.length === 0) {
        this.clima.set(null);
        this.mensaje.set('No encontré esa ciudad. Intenta con otra.');
        return;
      }

      const lugar = datosCiudad.results[0];

      // Con las coordenadas pedimos el clima actual.
      const urlClima = 'https://api.open-meteo.com/v1/forecast?latitude=' +
        lugar.latitude + '&longitude=' + lugar.longitude +
        '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation';
      const respuestaClima = await fetch(urlClima);
      if (!respuestaClima.ok) throw new Error();

      const datos = await respuestaClima.json();
      if (!datos.current) throw new Error();

      this.ubicacion.set(lugar.name + ', ' + lugar.country);
      this.clima.set(datos.current);
    } catch {
      this.clima.set(null);
      this.mensaje.set('No pude consultar el clima. Revisa tu conexión.');
    } finally {
      this.cargando.set(false);
    }
  }
}
