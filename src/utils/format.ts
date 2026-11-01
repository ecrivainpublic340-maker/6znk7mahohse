/**
 * Utilitaires de formatage monétaire en Dinar Algérien (DA)
 * et générateur de lien direct WhatsApp pour l'Algérie et l'international.
 */

export function formatDA(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 DA';
  }
  return `${Math.round(amount).toLocaleString('fr-DZ')} DA`;
}

export function cleanPhoneNumber(phone: string): string {
  // Supprime tous les caractères non numériques sauf le + initial
  return phone.replace(/[^\d+]/g, '');
}

export function getWhatsAppUrl(phone: string, clientName?: string, motif?: string, reste?: number): string {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return '#';

  let intlPhone = cleaned;

  // Si le numéro commence par +213 ou 00213
  if (intlPhone.startsWith('+')) {
    intlPhone = intlPhone.substring(1);
  } else if (intlPhone.startsWith('00')) {
    intlPhone = intlPhone.substring(2);
  } else if (intlPhone.startsWith('0') && (intlPhone.startsWith('05') || intlPhone.startsWith('06') || intlPhone.startsWith('07') || intlPhone.startsWith('02') || intlPhone.startsWith('03') || intlPhone.startsWith('04'))) {
    // Format national algérien (ex: 0550 12 34 56 -> 213550123456)
    intlPhone = '213' + intlPhone.substring(1);
  } else if (!intlPhone.startsWith('213') && (intlPhone.startsWith('5') || intlPhone.startsWith('6') || intlPhone.startsWith('7'))) {
    // Numéro à 9 chiffres sans 0
    intlPhone = '213' + intlPhone;
  }

  let message = `Bonjour${clientName ? ` ${clientName}` : ''}, nous vous contactons depuis le cabinet SERVI-DOX concernant votre dossier.`;
  if (motif) {
    message += ` (Dossier : ${motif})`;
  }
  if (reste && reste > 0) {
    message += ` Le solde restant à régler est de ${formatDA(reste)}.`;
  }

  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${intlPhone}?text=${encodedMsg}`;
}

export function getEmployeeWhatsAppUrl(phone: string, empName?: string, role?: string): string {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return '#';

  let intlPhone = cleaned;
  if (intlPhone.startsWith('+')) {
    intlPhone = intlPhone.substring(1);
  } else if (intlPhone.startsWith('00')) {
    intlPhone = intlPhone.substring(2);
  } else if (
    intlPhone.startsWith('0') &&
    (intlPhone.startsWith('05') ||
      intlPhone.startsWith('06') ||
      intlPhone.startsWith('07') ||
      intlPhone.startsWith('02') ||
      intlPhone.startsWith('03') ||
      intlPhone.startsWith('04'))
  ) {
    intlPhone = '213' + intlPhone.substring(1);
  } else if (
    !intlPhone.startsWith('213') &&
    (intlPhone.startsWith('5') || intlPhone.startsWith('6') || intlPhone.startsWith('7'))
  ) {
    intlPhone = '213' + intlPhone;
  }

  const message = `Bonjour${empName ? ` ${empName}` : ''}${role ? ` (${role})` : ''}, message de la direction SERVI-DOX : `;
  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
}

