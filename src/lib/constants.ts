export const CHURCH_LOCATIONS = [
  'Alaminos',
  'Bae',
  'Bagong Kalsada',
  'Biñan',
  'Cabuyao',
  'Calamba',
  'Calauan',
  'Canlubang',
  'Carmona',
  'GMA',
  'Macabling',
  'Makiling',
  'Pagsanjan',
  'Pila',
  'Romblon',
  'San Pablo',
  'Silang',
  'Sta. Cruz',
  'Sta. Rosa',
  'Victoria'
] as const; // Use 'as const' for better type inference

// Type helper if needed elsewhere, derived from the const
export type ChurchLocation = typeof CHURCH_LOCATIONS[number];
