import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Pelicula {
  id: number;
  titulo: string;
  anio: number;
  genero: string;
  descripcion: string;
}

@Injectable({ providedIn: 'root' })
export class MovieService {
  private http = inject(HttpClient);
  listar() { return this.http.get<Pelicula[]>('/api/peliculas'); }
  obtener(id: number) { return this.http.get<Pelicula>('/api/peliculas/' + id); }
  agregar(p: Omit<Pelicula, 'id'>) { return this.http.post<Pelicula>('/api/peliculas', p); }
  editar(id: number, p: Omit<Pelicula, 'id'>) { return this.http.put<Pelicula>('/api/peliculas/' + id, p); }
  eliminar(id: number) { return this.http.delete('/api/peliculas/' + id); }
}
