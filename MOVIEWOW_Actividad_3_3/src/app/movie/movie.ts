import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MovieService, Pelicula } from '../movie.service';

@Component({ selector: 'app-movie', imports: [CommonModule, RouterLink], templateUrl: './movie.html', styleUrl: './movie.css' })
export class Movie implements OnInit {
  private ruta = inject(ActivatedRoute);
  private servicio = inject(MovieService);
  pelicula?: Pelicula;
  error = '';
  ngOnInit() {
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    this.servicio.obtener(id).subscribe({
      next: p => this.pelicula = p,
      error: () => this.error = 'No se encontró la película o no se pudo conectar.'
    });
  }
}
