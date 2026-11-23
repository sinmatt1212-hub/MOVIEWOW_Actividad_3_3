import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MovieService, Pelicula } from '../movie.service';

@Component({
  selector: 'app-movies',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './movies.html',
  styleUrl: './movies.css'
})
export class Movies implements OnInit {
  private servicio = inject(MovieService);
  peliculas: Pelicula[] = [];
  mensaje = '';
  cargando = true;
  editando: number | null = null;
  formularioVisible = false;
  formulario = { titulo: '', anio: 2026, genero: '', descripcion: '' };

  ngOnInit() { this.cargar(); }
  cargar() {
    this.cargando = true;
    this.servicio.listar().subscribe({
      next: datos => { this.peliculas = datos; this.cargando = false; },
      error: () => { this.mensaje = 'No se pudo conectar con la base de datos.'; this.cargando = false; }
    });
  }
  nueva() {
    this.editando = null;
    this.formulario = { titulo: '', anio: new Date().getFullYear(), genero: '', descripcion: '' };
    this.formularioVisible = true;
    this.mensaje = '';
  }
  editar(p: Pelicula) {
    this.editando = p.id;
    this.formulario = { titulo: p.titulo, anio: p.anio, genero: p.genero, descripcion: p.descripcion };
    this.formularioVisible = true;
    this.mensaje = '';
  }
  guardar() {
    const datos = { ...this.formulario, anio: Number(this.formulario.anio) };
    if (!datos.titulo.trim() || !datos.genero.trim() || !Number.isInteger(datos.anio) || datos.anio < 1888 || datos.anio > 2200) {
      this.mensaje = 'Completa el título, género y un año válido.';
      return;
    }
    const solicitud = this.editando === null ? this.servicio.agregar(datos) : this.servicio.editar(this.editando, datos);
    solicitud.subscribe({
      next: () => { this.formularioVisible = false; this.mensaje = 'Película guardada correctamente.'; this.cargar(); },
      error: () => this.mensaje = 'No fue posible guardar la película.'
    });
  }
  eliminar(p: Pelicula) {
    if (!confirm('¿Eliminar ' + p.titulo + '?')) return;
    this.servicio.eliminar(p.id).subscribe({
      next: () => { this.mensaje = 'Película eliminada.'; this.cargar(); },
      error: () => this.mensaje = 'No fue posible eliminar la película.'
    });
  }
}
