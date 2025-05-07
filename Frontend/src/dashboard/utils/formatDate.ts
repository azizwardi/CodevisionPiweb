/**
 * Formate une date en format lisible
 * @param dateString - La date à formater (string ISO ou objet Date)
 * @returns La date formatée en français
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    return 'Date invalide';
  }
  
  // Options de formatage
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Intl.DateTimeFormat('fr-FR', options).format(date);
}
