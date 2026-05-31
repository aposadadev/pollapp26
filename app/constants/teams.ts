/**
 * Mapeo equipo → grupo de la fase de grupos del Mundial 2026.
 * Usado para validar límites de selección en clasificados (max 3 por grupo).
 */
export const TEAM_GROUPS: Record<string, string> = {
  'México': 'A', 'Corea del Sur': 'A', 'Sudáfrica': 'A', 'República Checa': 'A',
  'Canadá': 'B', 'Suiza': 'B', 'Qatar': 'B', 'Bosnia-Herzegovina': 'B',
  'Brasil': 'C', 'Marruecos': 'C', 'Escocia': 'C', 'Haití': 'C',
  'Estados Unidos': 'D', 'Paraguay': 'D', 'Australia': 'D', 'Turquía': 'D',
  'Alemania': 'E', 'Ecuador': 'E', 'Costa de Marfil': 'E', 'Curazao': 'E',
  'Países Bajos': 'F', 'Japón': 'F', 'Túnez': 'F', 'Suecia': 'F',
  'Bélgica': 'G', 'Irán': 'G', 'Egipto': 'G', 'Nueva Zelanda': 'G',
  'España': 'H', 'Uruguay': 'H', 'Arabia Saudita': 'H', 'Cabo Verde': 'H',
  'Francia': 'I', 'Senegal': 'I', 'Irak': 'I', 'Noruega': 'I',
  'Argentina': 'J', 'Argelia': 'J', 'Austria': 'J', 'Jordania': 'J',
  'Portugal': 'K', 'Colombia': 'K', 'Uzbekistán': 'K', 'RD del Congo': 'K',
  'Inglaterra': 'L', 'Croacia': 'L', 'Ghana': 'L', 'Panamá': 'L'
}
